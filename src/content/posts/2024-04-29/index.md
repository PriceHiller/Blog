---
title: Avoiding Collisions in Hash Tables
summary: We don't do "performance" 'round here.
tags:
  - college
  - datastructures
---

# A Quick Intro to Hash Tables and Collisions

A hash table maps a unique input to a value most typically stored in an array.

The goal of a hash table is to take advantage of a hash function that produces a position within an array where a given value might be stored for a unique key. This allows fast lookups into the array for the given key.

An example hash table of names to weight might be:

| Key (name) | Value (weight) | Position in Array |
| ---------- | -------------- | ----------------- |
| Xavier     | 202            | 0                 |
| Sam        | 150            | 1                 |
| Preston    | 168            | 2                 |

Where the values (with their keys) are stored in an array like so:

```
<key>,<value>
┌───────────────────────────────────────┐
│Xavier, 202 |  Sam, 150  | Preston, 168│
└───────────────────────────────────────┘
       0           1             2
```

When we do a lookup into that hash table for "Sam" the associated value would be 150 store at index 1 in our array in this case.

Here's the issue, to store a value into the backing array we're using a hash function which for performance reasons generally doesn't output a unique position to store a value within the array. This means there's a possibility for two different keys to map to the same place in memory, known as a collision.

We don't want to overwrite existing data, and thus we have strategies for resolving collisions. In no particular order here's the one's we'll go through:

- Separate Chaining
- Linear Probing (Open Addressing)
- Coalesced Hashing
- Double Hashing
- Brent's Method

# Separate Chaining
Considered to be the simplest technique for resolving collisions, each slot in the array references a linked list (or other similar data structure) of records that collide on that slot. Each record stores its key and associated value.

To insert into a hash table using chaining, call a hash function to get an index in which to store a given value in an array. Instead of directly inserting the value at that index, instead create a link between that index and a new node for a linked list.

If we have multiple records under a single index in the array, each record points to the next one and we insert onto the last record in that position.

# Linear Probing
Instead of storing colliding records under a separate data structure, open addressing instead stores directly on the array using a method known as probing.

When inserting a new record that collides with a preexisting record in the array, probing searches for the next available empty spot in the array and inserts the value there.

For example, given a slight modification of an earlier array like so:
```
<key>,<value> or (Null)
┌────────────────────────────────────────────────────────────────┐
│Xavier, 202 | (Null) | (Null) | Sam, 150 | (Null) | Preston, 168│
└────────────────────────────────────────────────────────────────┘
       0         1         2        3          4          5
```

Let's say we want to insert a new person Jane with weight 120 and that our hash function informs us to insert at index 3. There's an issue though, Sam already exists at index 3 and thus we cannot insert Jane into index 3. Thus we employ *linear probing* to find the next empty location in the array. The next empty location in this case is index 4, and thus we insert "Jane, 120" at position 4 in the array.

Our newly formed array will look something like this:
```
<key>,<value> or (Null)
┌───────────────────────────────────────────────────────────────────┐
│Xavier, 202 | (Null) | (Null) | Sam, 150 | Jane, 120 | Preston, 168│
└───────────────────────────────────────────────────────────────────┘
       0         1         2        3           4            5
```

Note that we are not just storing the associated value with a key into the array, we are storing both the key and value (the full record) in the array. This is important for searching for a given value. Since our hash function may not return the true position of a record, we have to check the keys against the search key until we find the correct record. The improvement over a simple linear search across the entire array though, is that our hash function informs us the index a given record must be at or be after.

# Coalesced Hashing

Coalesced Hashing combines Open Addressing with Separate Chaining.

Where separate chaining will store colliding records in a separate data structure (linked lists), coalesced hashing will store the records directly in the array while linking the records together in something known as a collision chain.

When inserting using coalesced hashing and we have a collision occur, we check if the record stored at the index points to another record and so and so forth until we reach the end of the links. Once we reach the end we linearly probe for the nearest open slot in the array and insert the new record into that position and add a link from the last record in the chain pointing to the newly inserted record.

The reason one might want to use coalesced hashing over just a simple linear probe approach is that a linear probe could potentially go over unrelated or empty records until finding the record being searched. With a coalesced approach, one can instead follow the chain of links until either the record is found or the end of the chain is reached. This avoids going through unrelated records during a search.

# Double Hashing

To handle collision resolution, double hashing does what's on the tin. It employs two hash functions to determine the position in the array for a record mixed with probing.

During insertion, double hashing uses one hash value to index into an array and then repeatedly steps forward a set interval determined by a second hash function until an empty slot is found upon which its index is returned.

By using a second hash function data ends up more uniformly spread across the underlying array of the hash table and results in a more probabilistic approach to determining indices.

# Brent's Method

Brent's method is a way of minimizing the average time of searching the underlying array of a hash table. Brent's method defines the hash function as: `hash(key) = key mod M` and a incrementing function as `i(key) = Quotient(Key / M) mod M` where `M` refers to the size of the table.

If a collision occurs during insertion, Brent's method will then do a check if we should move the colliding record to reduce the number of probes made during searches. If the number of probes required to retrieve a item is 3 more then a preexisting record will be shifted no more than 3 indices over to reduce the number of probes required during a search.
