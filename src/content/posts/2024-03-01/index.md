---
title: Nitpicking a Data Structures and Algorithms Midterm Question
summary: An anthill to die upon.
tags:
  - college
  - datastructures
  - c
---

# Context

I'm currently enrolled at a university working towards a Computer Science degree. As part of my degree plan I have to
take a Data Structures and Algorithms (DSA) course.

At the time of writing we had our midterm yesterday morning, and I missed marks on a question that I know for a fact had
no correct answer. This post is an analysis as to _why_ the question's multiple choice answers were all incorrect.

I'm writing this knowing I'm being a bit of a pedant and knowing that it's _only_ a single question. But for whatever
reason this keeps circling around in my mind throwing around all the chairs and spray painting gang markers on the
walls. As such, I'm writing to get the poltergeist out.

# The Question

Here's roughly the question that was asked:

> Given the following code:
>
> ```c
> #include <stdio.h>
>
> int main(int argc, char *argv[]) {
>     int arr[2][2] = {{1, 2}, {3, 4}};
>     for (int i = 0; i < 2; i++) {
>         for (int j = 0; j < 2; j--) {
>             printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
>         }
>     }
> }
> ```
>
> What will the program do?
>
> **a.)** There will be a warning\
> **b.)** Infinitely loop\
> **c.)** Output: `arr[0][0] = 1, arr[0][1] = 2, arr[1][0] = 3, arr[1][1] = 4, `\
> **d.)** Output: `[0][-1] = 1, arr[0][-2] = 2, arr[1][-1] = 3, arr[1][-2] = 4, `

I chose `a`, after realizing that's the _closest_ answer to being correct. Unfortunately this question is asking about
the most horrid thing on Earth and a large reason languages like Rust exist — **undefined behavior** (UB)[^1].

Answer `a`, of course, is not correct. The exam had answer `b` as correct, which is also wrong. In fact, none of the
above answers are correct.

# Why is the above code undefined behavior (UB)?

The code given to us has an out-of-bounds array access. Take a look at the `for` loops. The first `for` loop is all
good, no problem there. The inner one, however, is our problem child.

```c
int arr[2][2] = {{1, 2}, {3, 4}};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2; j--) { // This line is bad!
        // Eventually the sub-indexing of j will be out of bounds!
        printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
    }
}
```

The inner `for` loop decrements the variable `j` and will continue looping until `j` is not less than 2 (so loop until
`j` is more than or equal to 2). This means the array will eventually be indexed by whatever integer is stored into `j`
and since `j` is decremented from 0 it will be negative.

As a result the array will be sub-indexed by a negative number, which is outside the bounds of the array. This is our
undefined behavior.

Now that we've identified the issue with this problem let's get into why none of the provided answers are correct.

# Why is answer `a` wrong?

To save you some scrolling, answer `a` was `There will be a warning`. In this course, questions have been asked with
identical (or extremely close at least) answers like `a` which were interested in compiler behavior.

When I was marked wrong on this answer, I was actually quite surprised. Even more so when I recreated the identical code
and attempted to compile it with `gcc` and got the following compilation _error_:

```
t.c: In function ‘main’:
t.c:7:13: error: iteration 1 invokes undefined behavior [-Werror=aggressive-loop-optimizations]
    7 |             printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
      |             ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
t.c:6:27: note: within this loop
    6 |         for (int j = 0; j < 2; j--) {
      |                         ~~^~~
cc1: all warnings being treated as errors
```

It seemed apparent to me that the question had no right answers. Imagine my surprise then when the professor compiled
the same code in an online compiler and received neither an error or warning. That made me lose a bit of sanity and a
few hours later I realized the culprit, I have a _gat dang_ alias hiding out in my `zsh` config ruining property values:

```zsh
alias gcc="gcc -Werror -Wall -Wpedantic -Warray-bounds -O3"
```

I bring this up because I spent perhaps a few too many hours trying to figure out what the heck was going on. A simple
`command -v gcc` would've found it _immediately_, but I was too dumb to check that for quite some time 😞.

I also bring it up because my problem with a difference in compiler settings being a problem _is_ a problem. By having
potential answers be about compiler behavior the question immediately invokes a _ton_ of implicit compiler configuration
and flags that were (to my knowledge) never clearly stated in my course. The problem then is no longer about DSA —
instead it's about knowing the quirks of a compiler that may have differences on every single system and configurations
out there.

Ok, but let's just assume we're rocking standard `gcc` with no flags, and no configuration elsewhere. Thus, there
shouldn't be any compiler warnings or errors. With that caveat in mind, answer `a` can't be right.

# Why are answers `c` & `d` wrong?

I'm lumping these two together because they're wrong for similar reasons and I figure I should cover all of my bases.

Answers `c` & `d` were:

> **c.)** Output: `arr[0][0] = 1, arr[0][1] = 2, arr[1][0] = 3, arr[1][1] = 4, `\
> **d.)** Output: `[0][-1] = 1, arr[0][-2] = 2, arr[1][-1] = 3, arr[1][-2] = 4, `

`c` is wrong because the inner loop is being continuously decremented. In theory the sub-indexing integer `j` should _never_ get a positive value. Purely _in theory_.

`d` is wrong because by indexing negatively into the array, the output values are incredibly unlikely to match the
actual values stored in the array; on top of that, indexing negatively into an array in C invokes UB, making this
necessarily wrong anyhow.

# Why is the supposedly correct answer, `b`, also wrong?

Answer `b` stated that "**the program will infinitely loop**".

I'll paste the code again here for your reference so you don't have to scroll back up to see it.

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
    int arr[2][2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j--) {
            printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
        }
    }
}
```

On the surface level it certainly seems this code would infinitely loop. Our inner loop integer `j` is always being set
more and more negatively and it appears it will never be more than two. After all, subtracting one from a negative will
still leave you with a negative.

There are two reasons that come to my mind at a glance why the above code actually won't run until the Sun swallows the
Earth and time becomes meaningless.

## Why `b` is Wrong, Part Uno

The first reason that code won't run infinitely is the realities of undefined behavior.

On my laptop running Linux, kernel version 6.7.6 at the time of writing, the code above will have a segmentation fault
within the first few seconds of running. The Linux kernel actually has quite a few built-in security features and it
won't let my code willy nilly access random addresses which sometimes happens with the negative indexing.

Outside of the kernel security mechanisms, since we're in UB land who's to say what will actually happen as its
_undefined_. So at best saying it runs forever is a guess — not actually something that can be proven easily.

## Why `b` is Wrong, Part Dos

The second reason is the much stronger of the two. Let's, the for the sake of argument, say the above code never has a
segmentation fault. It will always be able to decrement `j` and sub-index into the array.

Even with these concessions, the program will still not run infinitely.

To understand why, we have to dive into how integers work in C.

### ISO/IEC 9899:2023 Purgatory [(Oh the misery)](https://youtu.be/vW23W0aDCjQ?t=32)

So let's go see what the actual published standard has to say on what an integer is. If we go on over to
[open-std.org](https://open-std.org) and go check out the latest published draft of "ISO/IEC 9899 - Revision of the C
standard" we end up with this [big ol' document](https://open-std.org/JTC1/SC22/WG14/www/docs/n3096.pdf). Crack 'er open
and head down to page 41, section `6.2.6.2` (fun to pronounce as "sixty-two sixty-two").

An integer, according to the standard, can be _signed_ or _unsigned_. Since the integer we're interested in, `j`, is a
signed integer, let's go through how a signed integer is standardized as in C.

> For signed integer types, the bits of the object representation shall be divided into three groups: value bits,
> padding bits, and the sign bit. ... the signed type uses the same number of _N_ bits as values bits and sign bit. _N -
> 1_ are value bits and the remaining bit is the sign bit. ... If the sign bit is zero, it shall not affect the
> resulting value. If the sign bit is one, it has value `-(2^(n-1))`.

Note one more thing, the standard does _not_ define the actual size of an integer. That's left to each implementation.
Since we're using the `gcc` compiler, let's see what the [`gcc` docs have to say on the size of a
integer](https://www.gnu.org/software/gnu-c-manual/gnu-c-manual.html#Integer-Types).

> The integer data types range in size from at least 8 bits to at least 32 bits. The C99 standard extends this range to
> include integer sizes of at least 64 bits. You should use integer types for storing whole number values (and the char
> data type for storing characters). The sizes and ranges listed for these types are minimums; depending on your
> computer platform, these sizes and ranges may be larger.

Ah... that's, uhhh, a pain — it's gonna vary by architecture.

On my system, integers get 32 bits when using `gcc` and thus can represent `4,294,967,295` distinct numbers. Remember,
the integer we're working with is signed, thus half of those numbers will be negative. That means the largest and
smallest numbers my integers can be are `2,147,483,647` and `-2,147,483,648` respectively.

Hmmm... what happens when we exceed either of those numbers? Let's find out.

```c
#include <stdio.h>
#include <limits.h>
#include <stdlib.h>

int main()
{
    printf("Starting number is: %d\n", INT_MIN);
    printf("New number is: %d\n", INT_MIN - 1);
    return EXIT_SUCCESS;
}
```

`INT_MIN` in this case is the smallest integer representable.

`gcc` warns about an "integer overflow"... interesting.

```
❯ gcc program.c

t.c: In function ‘main’:
t.c:8:43: warning: integer overflow in expression of type ‘int’ results in ‘2147483647’ [-Woverflow]
    8 |     printf("New number is: %d\n", INT_MIN - 1);
      |                                           ^
```

Well let's run it and see what the output is.

```
❯ ./a.out

Starting number is: -2147483648
New number is: 2147483647
```

Oh, huh. Neat.

So if we exceed the bounds the sign flips, literally an overflow or, in this case, an underflow.

### Actually for real this time why `b` is wrong

With the overflow and underflow behavior now covered, let's take a look back at the code given to me in class:

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
    int arr[2][2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j--) {
            printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
        }
    }
}
```

Now with everything we've covered let's go point by point:

1. So long as `j` is less than 2 this will continue to run.
2. Integer `j` will be decremented for every execution of the inner loop.
3. Integer types have a maximum capacity and if we exceed that capacity the sign changes.
4. Eventually, `j` will reach the smallest value an integer can represent and on the next loop it will underflow and
   become a massively positive number.
5. Integer `j` will then eventually be more than 2 in value and thus the condition `j < 2` will be invalidated and the loop
   will end.

To prove the code won't infinitely loop, let's actually run the code with a few small modifications to speed things up:

```c
#include <limits.h>
#include <stdio.h>

int main(int argc, char *argv[]) {
    int arr[2][2] = {{1, 2}, {3, 4}};
    // Move j's initializer up here so we can access it after the loop.
    // Also, set j to `INT_MIN` so our loop doesn't have to decrement
    // 2147483648 times before the theorized underflow occurs which
    // just cuts down on how long it takes to underflow.
    int j = INT_MIN;
    for (int i = 0; i < 2; i++) {
        for (; j < 2; j--) {
            // Comment out the arr access to avoid seg faults
            // printf("arr[%d][%d] = %d, ", i, j, arr[i][j]);
            printf("J -> %d\n", j);
        }
    }
    // If the loop isn't infinite, we should see this message
    printf("THE LOOP WAS NOT INFINITE, J VALUE: %d\n", j);
}
```

Running the above outputs:

```
❯ gcc prog.c && ./a.out

J -> -2147483648
THE LOOP WAS NOT INFINITE, J VALUE: 2147483647
```

Y u p. That's underflow for sure.

We can clearly see where `j` was the smallest possible integer and then wrapped around to the largest possible integer
and in doing so caused the inner loop to end.

Thus, answer `b` is also wrong.

# A quick summary

As a result of all the above points, we can readily see that the potential answers we could pick from are all wrong.

> **a.)** There will be a warning \
> **b.)** Infinitely loop <- An integer underflow will eventually occur causing the looping to end \
> **c.)** Output: `arr[0][0] = 1, arr[0][1] = 2, arr[1][0] = 3, arr[1][1] = 4, ` \
> **d.)** Output: `[0][-1] = 1, arr[0][-2] = 2, arr[1][-1] = 3, arr[1][-2] = 4, `

A quick summary of why each is wrong:

**a.)** We won't get a warning unless we specify compiler flags/config for `gcc`. \
**b.)** An integer underflow will occur causing the looping to end and thus the program has a finite execution period,
and also the program will almost certainly have a segmentation fault causing the looping to end. \
**c.)** `j` will never sub-index into 1 or 2. \
**d.)** Indexing `j` negatively invokes undefined behavior, so we can't know the output. As well as the fact that the
pattern for accessing the first index is wrong anyhow.

# Is My Pedantry (🤓) Satisfied Now?

Somewhat, to be wholly honest I am still annoyed I got marked off on that question. At least now I can point somewhere
and say "See, look! I was right!" and then stick my fingers in my ears and cry in the corner.

I actually skipped how integers _really_ work under the hood in terms of their binary representation. If you're
interested, here's the binary of the earlier underflow code example:

```
Starting number is: -2147483648 | Binary: 10000000000000000000000000000000
      New number is: 2147483647 | Binary: 01111111111111111111111111111111
```

That opens up a whole 'nother can of worms of _two's complement_ and actually how the bits are stored and manipulated.
A deeper look at why the underflow behavior occurs through how integers are added at the binary level can also be used
to disprove answer `b`. I cut a full break down of this out, because I realized it was somewhat irrelevant. The quick
integer whole number example makes the same point without nearly as much technicality.

The main takeaway: anytime you end up in undefined behavior land with C things get wacky real quick and all numeric
types are actually black magic pretending to be approachable.

[^1]: If you don't know what undefined behavior is, Wikipedia has an article on it [here](https://en.wikipedia.org/wiki/Undefined_behavior).
