#!/bin/bash

echo 'cur path is '`pwd`

npm run clean
npm run build
pm2 restart pm2.json