## Finding

The latest supply team alert was sent to the intended address and Resend marked it as delivered:

- Recipient: `Jduchate@nycourts.gov`
- From: `NYSC Facilities Hub <notifications@nyscfhub.com>`
- Subject: `New supply request: 2026-07-07-015 — Request for Binders (1")`
- Sent: `2026-07-08 02:00:27 UTC`
- Resend ID: `7bb23ce3-a12b-4abe-ae8b-d7017ae715cc`
- Provider status: `delivered`
- Message ID: `<0100019f3f7480de-2dca57b2-e2c3-4794-9870-89a2ddf5e2eb-000000@email.amazonses.com>`

That means the app and Resend handed the email off successfully; if it is not visible in the inbox, the remaining likely issue is on the NYCourts mail side: quarantine, spam filtering, Focused/Other inbox, routing rules, or delayed internal delivery.

## Plan

1. **Add durable email delivery records**
   - Store each supply email attempt with request ID, email type, recipient, sender, subject, provider email ID, and provider status.
   - This avoids relying only on edge function logs.

2. **Show email status in Supply Requests admin**
   - Add a small delivery-status section on each supply request showing whether the team alert was sent, skipped, failed, or delivered.
   - Include the provider message ID so NYCourts IT can search mail logs directly.

3. **Improve recipient handling**
   - Normalize recipient addresses to lowercase before sending and de-duplicate them.
   - Keep display casing in the settings UI if desired, but send canonical lowercase values.

4. **Add a test email action**
   - Add an admin-only “Send test email” action from the supply email settings card.
   - The test will send to the configured supply-team recipient list and display the returned provider status.

5. **Surface provider errors clearly**
   - If Resend rejects, bounces, or suppresses a recipient, show that exact status/details in the admin UI instead of only logging it.

## Immediate non-code check

Ask NYCourts IT to search for the Message ID above, or search the mailbox for the subject line and sender `notifications@nyscfhub.com`.