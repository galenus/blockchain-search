### Description
This example application allows searching for Bitcoin blocks using the [Bitcoin Explorer API](https://blockchain.info).

Given a Unix timestamp it will return the last Bitcoin block created **before** this timestamp.  

### Invocation
To run:
```shell
npm install
npm start
```

To stop: `Ctrl+C`

### Algorithm Description

Basically this is a logarithmic search, the differences being:
1. Choosing the initial pivot is done using 'educated guess': given we know the average 
block creation time, we can try and guess the location of the block we are looking for by dividing
the time passed from the genesis block creation to the specified timestamp by the average block time.
The later search will be performed around this value.
2. Approximation is done not based on the position in the chain (index/height delta divided by 2), but on the
distance from the specified timestamp.
3. Due to non-constant block creation times, the approximation based on the average creation time is not 
precise and must be checked against the previously discovered blocks, so the new approximation does not
'overshoot' them and the algorithm converges.

The algorithm steps are as following:
1. If the timestamp is greater than the latest block time, return the latest block.


2. Initialize the 'previous' discovered block with the latest block value and the 'current' block by 
estimating the block height (position) based on timestamp destination from the genesis block.


3. If the 'current' block timestamp is less than the required timestamp, estimate next block height by adding 
the time difference between the 'current' block and the required timestamp divided by average block duration 
to 'current' block height. Limit the new height by being below the 'previous' block height, to prevent 
'overshooting', and being at least 1, to prevent the process from being stuck.


4. If the 'current' block timestamp is greater than the required timestamp, estimate next block height by 
subtracting the time difference between the 'current' block and the required timestamp divided by average 
block duration from 'current' block height. Limit the new height by being above 'previous' block height, to 
prevent 'overshooting', and being at least 1, to prevent the process from being stuck.


5. Replace the 'previous' block with value of 'current' and fetch a new value for 'current' from the API, 
based on the new calculated height.


6. Repeat steps 3-5 until either 'current' or 'previous' block time is greater or equals to the specified
timestamp and the difference in these blocks' heights is exactly 1. This makes sure that we have two blocks
'surrounding' the specified timestamp.


7. Return the block with creation time below the specified timestamp.
