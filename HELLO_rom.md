```
1  1 1111 1    1     111
1  1 1    1    1    11 11
1111 111  1    1    1   1
1  1 1    1    1    11 11
1  1 1111 1111 1111  111
```

## turn sprite into hex

10010111 10100001 00000111 0
10010100 00100001 00001101 1
11110111 00100001 00001000 1
10010100 00100001 00001101 1
10010111 10111101 11100111 0

console.log((0b10010111).toString(16)); console.log((0b10100001).toString(16)); console.log((0b00000111).toString(16)); console.log((0b00000000).toString(16));
console.log((0b10010100).toString(16)); console.log((0b00100001).toString(16)); console.log((0b00001101).toString(16)); console.log((0b10000000).toString(16));
console.log((0b11110111).toString(16)); console.log((0b00100001).toString(16)); console.log((0b00001000).toString(16)); console.log((0b10000000).toString(16));
console.log((0b10010100).toString(16)); console.log((0b00100001).toString(16)); console.log((0b00001101).toString(16)); console.log((0b10000000).toString(16));
console.log((0b10010111).toString(16)); console.log((0b10111101).toString(16)); console.log((0b11100111).toString(16)); console.log((0b00000000).toString(16));

10010111/97 10100001/a1 00000111/7 000000000/0
10010100/94 00100001/21 00001101/d 100000000/80
11110111/f7 00100001/21 00001000/8 100000000/80
10010100/94 00100001/21 00001101/d 100000000/80
10010111/97 10111101/bd 11100111/e7 000000000/0

97 94 f7 94 97 a1 21 21 21 bd 07 0d 08 0d e7 00 80 80 80 00

## set i to the address of the first sprite

a260 // program start at 200, 58 need to be after that

## set v0 to be x

6001

## set v1 to be y

6101

## draw 5 row (1/4)

d015

a2 60 60 01 61 01 d0 15 a2 65 62 08 80 24 d0 15
a2 69 80 24 d0 15 a2 6e 80 24 d0 15 f3 0a 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
97 94 f7 94 97 a1 21 21 21 bd 07 0d 08 0d e7 00
80 80 80 00

## set i to the address of the next sprite

a(260 + 5)
a265

## add 8 to v0, move x to right

6208 // save 8 to v2
8024 // add v2 to v0

## draw 5 row (2/4)

d015

## set i to the address of the next sprite

a26a

## add 8 to v0, move x to right

8024 // add v2 to v0

## draw 5 row (3/4)

d015

## set i to the address of the next sprite

a26f

## add 8 to v0, move x to right

8024 // add v2 to v0

## draw 5 row (3/4)

d015

## pause

f30a
