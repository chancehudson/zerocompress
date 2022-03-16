# Zlib Comparison

We benchmarked the tx size reduction by taking 100 transactions and serializing them the same way Optimism does for L1 submission. This was the outcome for a few batches:


```
Batch data without zlib:
  original     -  size=40440 bytes
                  gas cost=382020
  zerocompress -  size=21216 bytes
                  gas cost=301380
Batch data with zlib:
  original     -  size=14544 bytes
                  gas cost=231804
  zerocompress -  size=13953 bytes
                  gas cost=222360
```

```
Batch data without zlib:
  original     -  size=78318 bytes
                  gas cost=749448
  zerocompress -  size=41134 bytes
                  gas cost=581740
Batch data with zlib:
  original     -  size=26888 bytes
                  gas cost=428936
  zerocompress -  size=25475 bytes
                  gas cost=406304
```

```
Batch data without zlib:
  original     -  size=117523 bytes
                  gas cost=1127608
  zerocompress -  size=61249 bytes
                  gas cost=865552
Batch data with zlib:
  original     -  size=39304 bytes
                  gas cost=626788
  zerocompress -  size=37339 bytes
                  gas cost=595552
```
