import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBookingRequest} from '../src/features/journey/booking/validation.ts';
import {bookingMailConfig, bookingEmailText, deliverBookingRequest} from '../src/features/journey/booking/delivery.ts';
import {allowBookingRequest} from '../src/features/journey/booking/limit.ts';

const clock = new Date('2026-11-22T22:30:00.000Z'); // Nov 23 in Kyiv
const valid = () => ({
  name: 'Ірина', phone: '+380 67 123 45 67', email: 'user@example.com',
  date: '2026-11-23', people: 2, message: 'Доброго дня!', consent: true, locale: 'uk', website: '',
});
const config = {RESEND_API_KEY: 'secret', BOOKING_FROM_EMAIL:'requests@example.com', BOOKING_TO_EMAIL:'guide@example.com'};

test('booking payload is normalized and validates Kyiv day, including date rollover', () => {
  const parsed = validateBookingRequest(valid(), clock);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.data.date, '2026-11-23');
    assert.equal('website' in parsed.data, false);
  }
  assert.deepEqual(validateBookingRequest({...valid(), date:'2026-11-22'},clock), {ok:false,error:'invalid'});
  assert.equal(validateBookingRequest({...valid(), date:'2028-02-29'},clock).ok,true);
  assert.equal(validateBookingRequest({...valid(), date:'2027-02-29'},clock).ok,false);
});

test('server rejects missing consent, traps and invalid fields', () => {
  assert.deepEqual(validateBookingRequest({...valid(),consent:false}, clock),{ok:false,error:'consent'});
  assert.deepEqual(validateBookingRequest({...valid(),website:'spammer'}, clock),{ok:false,error:'spam'});
  for(const patch of [{phone:'hello'}, {email:'broken'}, {people:13}, {people:'2'}, {locale:'xx'}, {name:'A'}, {message:'x'.repeat(2001)}]) {
    assert.equal(validateBookingRequest({...valid(),...patch},clock).ok,false,JSON.stringify(patch).slice(0,40));
  }
});

test('delivery is fail-closed without verified provider configuration', async () => {
  const parsed=validateBookingRequest(valid(),clock);
  assert.equal(parsed.ok,true);
  if(!parsed.ok)return;
  assert.equal(bookingMailConfig({}),null);
  assert.equal(await deliverBookingRequest(parsed.data,{},async()=>{throw Error('must not call');}),'unavailable');
});

test('provider acceptance and errors are differentiated without logging PII', async () => {
  const parsed=validateBookingRequest(valid(),clock);
  assert.equal(parsed.ok,true);
  if(!parsed.ok)return;
  let calls=0;
  const ok=async(url,init)=>{
    calls++;
    assert.equal(url,'https://api.resend.com/emails');
    assert.equal(init.method,'POST');
    const body=JSON.parse(init.body);
    assert.equal(body.to[0],'guide@example.com');
    assert.equal(body.reply_to,'user@example.com');
    assert.match(body.text,/Ірина/);
    return {ok:true};
  };
  assert.equal(await deliverBookingRequest(parsed.data,config,ok),'sent');
  assert.equal(calls,1);
  assert.match(bookingEmailText(parsed.data),/not a confirmed reservation/);
  assert.equal(await deliverBookingRequest(parsed.data,config,async()=>({ok:false})),'failed');
  assert.equal(await deliverBookingRequest(parsed.data,config,async()=>{throw Error('timeout')}),'failed');
});

test('best effort limiter caps an IP within a 15 minute window', () => {
  const key='test-' + process.pid;
  for(let i=0;i<5;i++) assert.equal(allowBookingRequest(key,1000),true);
  assert.equal(allowBookingRequest(key,1001),false);
  assert.equal(allowBookingRequest(key,901001),true);
});
