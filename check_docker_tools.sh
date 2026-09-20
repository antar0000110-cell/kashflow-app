#!/bin/bash
docker run --rm kashflow-android-builder2 bash -c 'which pip pip3 python python3 convert magick 2>/dev/null; python3 -c "import sys; print(sys.version)" 2>/dev/null; pip3 install Pillow -q 2>&1 | tail -3'
