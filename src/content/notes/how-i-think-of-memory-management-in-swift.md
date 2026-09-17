---
title: How I think of memory management in Swift
date: 2026-09-17
tags:
  - appleacademy
featured: true
thumbnail: /images/notes/swift-arc-alice-bob.jpg
---

Personally, mental models and analogies are very fun ways to learn abstract concepts. Recently, I saw first hand the profound value of asking "why" when learning concepts. A question as simple as "Why is it called xx" can go a long way for memory (turns out many things are linked to references you already know!).

This week I got curious about the term "ARC" that people were throwing around in the Academy and looked under the hood of Swift into its compiler.

This is the mental model I came up with:

![Hand-drawn diagram of Alice and Bob each holding a yellow string to the same red balloon in a dashed RAM box, while a blue cloud labeled Automatic Reference Counter (ARC) shows strong references equal to 2](/images/notes/swift-arc-alice-bob.jpg)

> Have you read the book *The Little Prince* before? It's one of the first books I read in school. In the story, there's a little prince that lives on a tiny planet that is just barely larger than a house.

My mental model exists on a small planet too.

On that planet there are people (variables/properties) who love to fly balloons (class instances). But because the planet, and hence their airspace (RAM available), is so tiny, they can only fit a finite amount of balloons in the sky at once.

**ARC** is a cloud that keeps count of how many strings are attached to each balloon. As long as at least one strong string is attached, the balloon stays in the sky. When the last strong string is released, **ARC** notices the count has reached `0`. The balloon is then popped/removed from the sky, freeing that space in the airfield.

Breaking all of this down.

My iOS app is like the planet. The planet cannot keep infinite balloons around, so they have to be cleared when unused, so that others get airspace to fly their balloons too.

```swift
class Balloon {
	let color: String

	init(color: String) {
		self.color = color
	}
}

var balloon = Balloon(color: "Pink")
```

The actual 🎈 balloon is the class instance (of color Pink) created in memory. `balloon` (the variable) is the person holding a strong reference to the actual balloon.

Strings are the references:

```swift
var alice = Balloon(color: "Pink")
var bob = alice

// both alice and bob now hold a string (reference) each to the same balloon in memory
```

These strings are "strong references." ARC keeps track of how many of these are attached to each balloon.

Suppose Alice now goes home. She releases her reference: `alice = nil`

The balloon still stays because Bob is still holding his string tied to the balloon.

![Hand-drawn diagram of Bob alone holding a yellow string to the red balloon, with ARC showing a strong reference count of 1](/images/notes/swift-arc-bob-holds.jpg)

When it's time for Bob to go home too, `bob = nil`, ARC sees "strong references = 0" and deallocates this instance. Airspace empty!

It is possible for balloons to be tied up when they come from the packaging. If this happens, each balloon needs a property that lets it reference the balloon it's tied up with, `var tiedTo: Balloon?`

```swift
class Balloon {
	let color: String
	var tiedTo: Balloon?

	init(color: String) {
		self.color = color
	}
}

// Alice holds the pink balloon
var alice: Balloon? = Balloon(color: "Pink")

// Bob holds the blue balloon
var bob: Balloon? = Balloon(color: "Blue")

// The balloons are tied to each other
alice?.tiedTo = bob
bob?.tiedTo = alice
```

My planet looks like this now:

![Hand-drawn diagram of Bob holding a blue balloon and Alice holding a pink balloon, with the two balloons also tied to each other by strong references](/images/notes/swift-arc-tied-balloons.jpg)

Each balloon instance (Pink and Blue) now strong-references one another. When it comes time for Alice and Bob to go home (`nil`), the two balloons still have a strong reference count of 1 each because they are tied (referenced) to each other!

Although no one is holding any strings, they are stuck in the airspace. Now ARC can't remove them, and no person can access the balloon instances. And… fewer people can fly their balloons in the airspace since these balloons are taking up the space.

This is a **retain cycle** in Swift.

![Hand-drawn diagram of Object A and Object B pointing at each other with strong references](/images/notes/swift-arc-retain-cycle.jpg)

So how can we untie the balloons? Thankfully, Swift provides the `weak` keyword. Using `weak` is like having a string that **ARC** doesn't count.

> **Strong (implicit referencing) vs weak**
>
> A strong string keeps a balloon from being removed.
>
> A weak string lets one balloon know where another balloon is, but doesn't keep it in the sky.

In Swift, we usually don't make both sides weak. It is important to ask "Who actually needs to hold this balloon down and keep it in the sky?"

To better represent this:

```swift
class Person {
	var balloon: Balloon? // strong
}

class Balloon {
	weak var holder: Person? // weak
}

var alice: Person? = Person()
var pink: Balloon? = Balloon()

alice?.balloon = pink // alice holds on to the pink balloon
pink?.holder = alice // pink balloon knows holder is alice
```

Alice owns the balloon. The balloon knows that Alice is its holder, but the balloon doesn't own Alice.

> **Mental model from a `weak` point of view**
>
> I need to know about you, but I'm not responsible for keeping you alive.

The weak variable must be an optional (be able to become `nil`).

When Alice releases the balloon (strong reference on the balloon instance = 0), the balloon has to be removed by ARC.

But when it's time for Alice to go home (`alice = nil`), Alice is deallocated, `balloon.holder` automatically becomes `nil`, and so it has to be able to take a nil value, since its reference doesn't keep Alice alive.
