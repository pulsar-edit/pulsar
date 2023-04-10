#!/bin/bash

case $1 in
    *post-checkout)
        ACTION='Branch change'
        ;;
    *post-merge)
        ACTION='Remote pull'
        ;;
    *)
        ACTION="Unknown event ($1)"
        ;;
esac

echo "${ACTION} occurred, rebuilding editor"

export ATOM_ELECTRON_VERSION=$(cat package.json | rg --trim --replace "" '"electronVersion": "' | rg --replace "" '",')

replacement="1.100.$(date +'%Y%m%d%H%k%M')"
filter='("version": ")[0-9\.]+(",)'
regex="s/$filter/\1$replacement\2/"

sed --regexp-extended --in-place "$regex" package.json

echo '  Installing editor packages'
yarn install &> /dev/null
if [[ $? == 0 ]]; then
    echo '    Install completed successfully'
else
    echo '    Install failed'
    exit 1
fi

echo '  Rebuilding modules'
yarn build &> /dev/null
if [[ $? == 0 ]]; then
    echo '    Module build completed successfully'
else
    echo '    Module build failed'
    exit 1
fi

echo '  Rebuilding PPM'
if [[ -d "ppm" ]]; then
    yarn build:apm &> /dev/null
    if [[ $? == 0 ]]; then
        echo '    PPM build completed successfully'
    else
        echo '    PPM build failed'
        exit 1
    fi
else
    echo '    PPM folder not found'
fi

git submodule sync && git submodule update
