#!/bin/zsh
cd "$(dirname "$0")"
clear
echo "Fiveish 외부 공개를 시작합니다."
echo
python3 server.py --share
echo
echo "창을 닫으려면 Enter를 누르세요."
read
