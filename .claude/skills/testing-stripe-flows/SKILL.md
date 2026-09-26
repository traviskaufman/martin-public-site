---
name: testing-stripe-flows
description: Tests the path from Stripe checkout to the site's thank-you page by paying on a Stripe test-mode link that redirects to a Cloudflare Pages preview of the site. Use when changing the thank-you page, a payment link's redirect, the license-key button's checkout URL, or anything a buyer sees after paying, and before changing the live payment link.
---

# Testing Stripe flows

Pay on a Stripe test-mode link with a test card and land on the preview's thank-you page.

## Payment links

| Link            | ID                               | URL                                                 | After payment                                               |
| --------------- | -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Test, $5        | `plink_1UJirQC6tTA9gzp4rjnO5MdQ` | https://buy.stripe.com/test_4gMbJ057v5co8R42Ve7kc02 | Redirects to https://preview.trymartin-dev.pages.dev/thanks |
| Test, $0 invite | `plink_1UCpmkC6tTA9gzp4aUeAQTqk` | https://buy.stripe.com/test_cNi14mdE1eMY2sG3Zi7kc00 | Stripe's own confirmation page                              |
| Live, $5        | `plink_1UJj5wC6tTA9gzp4wLQec4ol` | `checkoutUrl` in `src/links.ts`                     | Redirects to https://trymartin.dev/thanks                   |

The test-mode webhook, https://martin-api-preview.travis-kaufman.workers.dev/stripe/webhook, mints a test key and emails it to the address typed at checkout.

## Steps

1. Build and deploy the preview:

   ```sh
   npm run build
   npx wrangler pages deploy dist --project-name=trymartin-dev --branch=preview
   ```

2. Read the $5 test link (`GET /v1/payment_links/plink_1UJirQC6tTA9gzp4rjnO5MdQ`, test mode) and check that `after_completion.redirect.url` is `https://preview.trymartin-dev.pages.dev/thanks`. If it is not, set it:

   ```
   POST /v1/payment_links/plink_1UJirQC6tTA9gzp4rjnO5MdQ
   after_completion[type]=redirect
   after_completion[redirect][url]=https://preview.trymartin-dev.pages.dev/thanks
   ```

3. Open https://buy.stripe.com/test_4gMbJ057v5co8R42Ve7kc02 in a browser, once at 390×844 and once at 1440×900.
4. Choose **Card** under "Payment method" and pay with:

   | Field                   | Value                  |
   | ----------------------- | ---------------------- |
   | Email (`#email`)        | `delivered@resend.dev` |
   | Card number             | `4242 4242 4242 4242`  |
   | Expiry                  | `12 / 34`              |
   | CVC                     | `123`                  |
   | Full name on card       | `Test Buyer`           |
   | Country or region / ZIP | `US` / `10001`         |

   Untick "Save my information for faster checkout" (`#enableStripePass`), or Link asks for a phone number. An agent ticks "I am an AI agent acting on behalf of someone else"; it sits outside the viewport, so send it a click event (`dispatchEvent("click")`). Submit with the `hosted-payment-submit-button` test id; four other buttons are also named "Pay …".

5. Pass: the browser ends on https://preview.trymartin-dev.pages.dev/thanks showing "Your key is on its way".

WARNING: A real address at checkout receives a real email from the preview API; use `delivered@resend.dev`.

IMPORTANT: Change the live link only after this passes.
