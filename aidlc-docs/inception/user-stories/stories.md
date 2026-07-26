# User Stories — Inkwell (Phase 1)

**Breakdown approach**: Hybrid (persona-based top-level grouping, feature-organized within each persona), per approved [story-generation-plan.md](../plans/story-generation-plan.md).
**Acceptance criteria format**: Gherkin (Given/When/Then).
**Granularity**: One story per distinct user action.
**Personas**: See [personas.md](personas.md) — Seller ("Riley"), Buyer ("Sam"). No Admin persona in Phase 1 (Question 4: A).
**Traceability**: Each story references the requirements.md FR it implements.

All stories follow INVEST: each is independently shippable/testable, negotiable on implementation detail, valuable to its persona, small enough to estimate, and has explicit acceptance criteria.

---

## Seller Stories

### Account & Shop Setup (FR-1, FR-2)

#### S-1: Seller creates an account
**As a** prospective seller, **I want to** sign up for an account, **so that** I can open a shop.
```gherkin
Given I am not signed in
When I complete sign-up via email or an OAuth provider
Then my account is created
And I am signed in with the ability to act as a seller
```

#### S-2: Seller creates a shop profile
**As a** seller, **I want to** create my shop profile, **so that** buyers can find and recognize my brand.
```gherkin
Given I am signed in and have no shop yet
When I submit a banner, avatar, bio, and social links
Then a shop profile is created and associated with my account
And the shop is visible at a shop URL
```

#### S-3: Seller edits shop profile
**As a** seller, **I want to** edit my existing shop profile, **so that** it stays current.
```gherkin
Given I have an existing shop profile
When I change my bio, banner, avatar, or social links and save
Then the shop profile reflects the updated values immediately
```

#### S-4: Seller uploads portfolio gallery images
**As a** seller, **I want to** add images to my portfolio gallery, **so that** buyers can see my work.
```gherkin
Given I have an existing shop
When I upload one or more portfolio images
Then the images appear in my shop's portfolio grid
And each image is resized/optimized for gallery display
```

#### S-5: Seller creates a commission rule set
**As a** seller, **I want to** define my commission rules in a structured editor, **so that** buyers see accurate, current terms.
```gherkin
Given I have an existing shop with no published rule set
When I define pricing tiers, add-ons, and written rules (what I will/won't draw, turnaround time) and publish
Then a versioned commission rule set is created and visible on my shop page
```

#### S-6: Seller publishes an updated commission rule set
**As a** seller, **I want to** update my published rules, **so that** they reflect my current terms.
```gherkin
Given I have a previously published commission rule set
When I edit the rules and publish again
Then a new version is created
And past buyers' requests still reference the rule version that applied when they requested
```

#### S-7: Seller opens commission slots
**As a** seller, **I want to** mark my shop as open for commissions, **so that** buyers can submit requests.
```gherkin
Given my shop's slot state is "closed" or "waitlist"
When I set the slot state to "open"
Then the commission request form becomes available to buyers on my shop page
```

#### S-8: Seller closes commission slots
**As a** seller, **I want to** mark my shop as closed, **so that** I stop receiving new requests when I'm at capacity.
```gherkin
Given my shop's slot state is "open"
When I set the slot state to "closed"
Then the commission request form is disabled on my shop page
And existing in-progress requests are unaffected
```

#### S-9: Seller enables a waitlist
**As a** seller, **I want to** offer a waitlist instead of a hard close, **so that** interested buyers can queue for a future opening.
```gherkin
Given my shop's slot state is "open" or "closed"
When I set the slot state to "waitlist"
Then buyers can join a waitlist instead of submitting a normal commission request
```

#### S-10: Seller sets a maximum queue limit
**As a** seller, **I want to** cap how many active requests I hold at once, **so that** I don't get overwhelmed.
```gherkin
Given I am editing my commission rule set
When I set a maximum queue limit (maxQueue)
Then the shop auto-transitions to "closed" once that many requests are in an active (non-terminal) status
```

#### S-11: Seller adds a pricing tier
**As a** seller, **I want to** define distinct pricing tiers (e.g. sketch, full color), **so that** buyers can pick the right option.
```gherkin
Given I am editing my commission rule set
When I add a tier with a name, description, and price
Then the tier is available for buyers to select on the commission request form
```

#### S-12: Seller adds a paid add-on
**As a** seller, **I want to** define add-ons (extra character, rush fee), **so that** buyers can customize their request and I'm compensated for the extra work.
```gherkin
Given I am editing my commission rule set
When I add an add-on with a name and price delta
Then the add-on appears as an optional selection on the commission request form
And its price is added to the request's computed total
```

### Listings (FR-5)

#### S-13: Seller creates a "buy now" listing
**As a** seller, **I want to** list a finished piece for direct sale, **so that** buyers can purchase it without a commission request.
```gherkin
Given I have an existing shop
When I create a listing with a title, price, and image(s), marked as "finished work"
Then the listing appears in the public gallery and on my shop page as directly purchasable
```

#### S-14: Seller edits or removes a listing
**As a** seller, **I want to** update or take down a listing, **so that** it reflects availability (e.g., mark as sold).
```gherkin
Given I have an existing "buy now" listing
When I edit its details or mark it sold/removed
Then the change is reflected immediately in the public gallery
```

### Commission Request Handling (FR-4)

#### S-15: Seller views an incoming commission request
**As a** seller, **I want to** see the full details of a new request, **so that** I can decide whether to accept it.
```gherkin
Given a buyer has submitted a commission request to my shop
When I open the request
Then I see the selected tier/add-ons, budget, deadline preference, description, and reference images
```

#### S-16: Seller accepts a commission request
**As a** seller, **I want to** accept a request, **so that** work begins and the buyer's payment moves into escrow.
```gherkin
Given a request is in "Requested" status
When I accept it
Then the request transitions to "Accepted"
And the buyer's payment is authorized into escrow (delayed capture)
```

#### S-17: Seller declines a commission request
**As a** seller, **I want to** decline a request with a reason, **so that** the buyer isn't left waiting and isn't charged.
```gherkin
Given a request is in "Requested" status
When I decline it and provide a reason
Then the request transitions to "Declined"
And no payment is captured or authorized
```

#### S-18: Seller messages within a request thread
**As a** seller, **I want to** message the buyer about their request, **so that** we can clarify details or share progress.
```gherkin
Given a request exists between me and a buyer
When I send a message in the request's thread
Then the buyer sees the message in the same thread
```

#### S-19: Seller marks a request "In Progress"
**As a** seller, **I want to** mark that I've started work, **so that** the buyer knows their request is active.
```gherkin
Given a request is in "Accepted" status
When I mark it "In Progress"
Then the request's status updates and is visible to the buyer
```

#### S-20: Seller submits work for buyer review
**As a** seller, **I want to** deliver work for buyer approval, **so that** the buyer can confirm or request a revision.
```gherkin
Given a request is in "In Progress" status
When I submit deliverables for review
Then the request transitions to "Delivered"
And the buyer is able to approve or request a revision
```

#### S-21: Seller handles a revision request
**As a** seller, **I want to** see revision feedback and resubmit, **so that** I can address buyer concerns before completion.
```gherkin
Given a request is in "Delivered" status and the buyer requested a revision
When I address the feedback and resubmit
Then the request returns to "Delivered" for another round of buyer review
```

### Payments (FR-6)

#### S-22: Seller connects a Stripe account
**As a** seller, **I want to** onboard with Stripe Connect, **so that** I can receive payouts.
```gherkin
Given I have a shop but no connected Stripe account
When I complete Stripe Connect Express onboarding
Then my account is linked and eligible to receive payouts
And I cannot accept a commission or list a "buy now" item until onboarding is complete
```

#### S-23: Seller receives a payout on completion
**As a** seller, **I want to** be paid automatically when an order completes, **so that** I don't have to chase payment.
```gherkin
Given an order reaches "Completed" status
When the platform processes payouts
Then the seller receives the order amount minus the platform commission via Stripe transfer
```

#### S-24: Seller views transaction history
**As a** seller, **I want to** see my past orders and payouts, **so that** I can track my income.
```gherkin
Given I have completed orders
When I open my transaction history
Then I see each order's amount, platform fee, and payout status
```

---

## Buyer Stories

### Browse & Discover (FR-3)

#### S-25: Buyer browses the public gallery
**As a** buyer, **I want to** browse listings and portfolio pieces, **so that** I can discover art I like.
```gherkin
Given listings and portfolio pieces exist
When I open the public gallery
Then I see a feed of listings and pieces from multiple sellers
```

#### S-26: Buyer filters listings
**As a** buyer, **I want to** filter by medium, style, price range, and commission availability, **so that** I can narrow results to what I want.
```gherkin
Given I am viewing the public gallery
When I apply one or more filters (medium, style tag, price range, commission-availability)
Then only matching listings/shops are shown
```

#### S-27: Buyer searches for an artist or shop
**As a** buyer, **I want to** search by artist name or shop, **so that** I can find a specific seller.
```gherkin
Given shops exist on the platform
When I search by artist or shop name
Then matching shop(s) appear in the results
```

#### S-28: Buyer views a shop page
**As a** buyer, **I want to** view a seller's full shop page, **so that** I can evaluate their work and rules before requesting.
```gherkin
Given a shop exists
When I open the shop page
Then I see the banner, bio, portfolio grid, published commission rules (if open/waitlist), and current slot status
```

### Commission Requests (FR-4)

#### S-29: Buyer views a seller's commission rules
**As a** buyer, **I want to** read a seller's rules before requesting, **so that** I know what's allowed and what it costs.
```gherkin
Given a seller has a published commission rule set
When I view their shop page
Then I see the current tiers, add-ons, and written rules
```

#### S-30: Buyer submits a commission request
**As a** buyer, **I want to** submit a request that matches the seller's published rules, **so that** my request is valid on arrival.
```gherkin
Given a seller's slot state is "open"
When I select a tier/add-ons and submit a request with description, budget, and deadline preference
Then the request is created in "Requested" status, referencing the exact rule version in effect
And I cannot submit a request that violates the seller's stated terms (e.g., unsupported tier, closed slot)
```

#### S-31: Buyer uploads reference images with a request
**As a** buyer, **I want to** attach reference images to my request, **so that** the seller understands what I want.
```gherkin
Given I am filling out a commission request form
When I attach one or more reference images
Then the images are stored with the request and visible to the seller
```

#### S-32: Buyer joins a waitlist
**As a** buyer, **I want to** join a seller's waitlist when they're not accepting requests directly, **so that** I'm queued for a future opening.
```gherkin
Given a seller's slot state is "waitlist"
When I submit a waitlist entry
Then I am added to the seller's waitlist
And I am notified if/when the seller opens slots
```

#### S-33: Buyer messages within a request thread
**As a** buyer, **I want to** message the seller about my request, **so that** we can discuss details or revisions.
```gherkin
Given a request exists between me and a seller
When I send a message in the request's thread
Then the seller sees the message in the same thread
```

#### S-34: Buyer views request status
**As a** buyer, **I want to** see the current status of my request, **so that** I know where things stand without asking.
```gherkin
Given I have submitted a request
When I open my request/order view
Then I see its current status (Requested/Accepted/In Progress/Revision/Delivered/Completed/Declined)
```

#### S-35: Buyer approves delivered work
**As a** buyer, **I want to** approve delivered work, **so that** the order completes and payment releases to the seller.
```gherkin
Given a request is in "Delivered" status
When I approve the delivery
Then the request transitions to "Completed"
And the escrowed payment captures and releases to the seller (minus platform commission)
```

#### S-36: Buyer requests a revision
**As a** buyer, **I want to** request a revision on delivered work, **so that** I get what I originally asked for.
```gherkin
Given a request is in "Delivered" status
When I request a revision with feedback
Then the request transitions back to an active in-progress state
And the seller sees my feedback
```

### Purchases (FR-5, FR-6)

#### S-37: Buyer purchases a "buy now" listing
**As a** buyer, **I want to** buy finished work directly, **so that** I don't have to go through the commission-request pipeline.
```gherkin
Given a "buy now" listing is available
When I check out and pay
Then the order is captured immediately (no escrow/acceptance step)
And the listing is marked sold/unavailable to other buyers
```

#### S-38: Buyer pays into escrow for an accepted commission
**As a** buyer, **I want to** know my payment is protected until I receive my commission, **so that** I'm not at risk of paying for undelivered work.
```gherkin
Given my commission request has just been accepted by the seller
When the escrow payment authorization completes
Then funds are held (not yet captured) until I approve the delivered work
```

#### S-39: Buyer views their order/transaction history
**As a** buyer, **I want to** see my past and current orders, **so that** I can track my purchases and commissions.
```gherkin
Given I have one or more orders (commissions or buy-now purchases)
When I open my order history
Then I see each order's status, amount, and associated seller
```

#### S-40: Buyer receives a refund
**As a** buyer, **I want to** be refunded when a request is declined or a dispute is resolved in my favor, **so that** I'm not out money for work I didn't receive.
```gherkin
Given a request was declined before capture, or a dispute was resolved in my favor
When the refund is processed
Then any authorized/captured funds are returned to my original payment method
And the order/request reflects a "Refunded" outcome
```

---

## Persona-to-Story Map

| Persona | Stories |
|---|---|
| Seller ("Riley") | S-1 through S-24 |
| Buyer ("Sam") | S-25 through S-40 |

## INVEST Compliance Note

Each story above is scoped to a single user action (Independent/Small), states a clear persona benefit (Valuable), leaves implementation approach open (Negotiable), is small enough for a single Code Generation unit-of-work to estimate (Estimable), and has explicit Given/When/Then acceptance criteria (Testable).
