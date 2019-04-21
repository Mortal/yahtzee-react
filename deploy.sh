#!/bin/sh
TAG=`git describe --tags`
URL="https://github.com/Mortal/yahtzee-react/releases/download/$TAG/yahtzee-react.tar.gz"
if ! curl -Isf "$URL" > /dev/null; then
  echo $URL
  echo "Couldn't find a release for tag $TAG"
  exit 1
fi
ssh lyra "cd /var/www/yatzy.strova.dk/htdocs && curl -L '$URL' | tar xzv"
