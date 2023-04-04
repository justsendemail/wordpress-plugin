#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR;

if [ "X$1" == "X" ]; then
  echo "Usage: ./build-zip.sh <version>"
  exit;
fi

# Build the React App in Production Mode
cd settings-app;
npm run dist
# Copy the minified JavaScript to
# the Plugin js/ directory
cp dist/index_bundle.js* ../js/;

# Pop back to the script dir
cd $DIR;
# And get its basename
src_dir=$(basename $DIR)
cd ..;

zip -r just-send-email-connect-$1.zip $src_dir/ \
  -x '*/settings-app/node_modules/*' \
  -x '*/settings-app/*-lock*' \
  -x '*/settings-app/dist/*' \
  -x '*/settings-app/data/*' \
  -x '*/settings-app/.idea/*' \
  -x '*/.gitignore' \
  -x '*/.git/*' \
  -x '.idea/*' \
  -x '*build-zip.sh*' \
  -x '*dev-setup.txt*'

