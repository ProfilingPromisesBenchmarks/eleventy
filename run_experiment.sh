#!/bin/bash

for i in {1..50}
do
  time npm run test >> runtimes.log 2>&1
done
