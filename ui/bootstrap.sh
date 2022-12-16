#!/bin/bash
set -e

LINK_FOLDER="`pwd`/ui"
echo "work dir: $LINK_FOLDER"
cd $LINK_FOLDER

# rm -rf build

npm unlink zk-multi-sign
npm link zk-multi-sign
npm run build
