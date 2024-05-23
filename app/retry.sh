#!/bin/bash

# Set the number of repetitions
repetitions=100

# Execute the command 'npm run' repeatedly
for i in $(seq 1 $repetitions); do
  #npm run setupALT
  #npm run initialize
  npm run swapAndBridge
done
