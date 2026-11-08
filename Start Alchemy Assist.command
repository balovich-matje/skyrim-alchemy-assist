#!/bin/bash
# Double-click to launch Skyrim Alchemy Assist in your browser.
# Add --lan to the python3 line below to use it from other devices on your network.
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 was not found. Install Xcode Command Line Tools with:  xcode-select --install"
  read -r -p "Press Return to close." _
  exit 1
fi
python3 server.py "$@"
