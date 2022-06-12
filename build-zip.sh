#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR;

cd settings-app;
npm run dist
cp dist/index_bundle.js* ../js/;
cd ..;
cd ..;
zip -r just-send-email-connect-$1.zip just-send-email-connect/ \
  -x '*/settings-app/node_modules/*' \
  -x '*/settings-app/*-lock*' \
  -x '*/settings-app/dist/*' \
  -x '*/settings-app/data/*' \
  -x '*/.gitignore' \
  -x '*/.git/*' \
  -x '*build-zip.sh*'

