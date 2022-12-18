#!/bin/bash
set -e

rm -rf .output
npm run build
npm run preview