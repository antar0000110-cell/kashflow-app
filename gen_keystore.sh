#!/bin/bash
cd /root/kashflow-app
keytool -genkey -v -keystore zux-release.keystore \
  -alias zux_key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass ZUX2026SecurePass! \
  -keypass ZUX2026SecurePass! \
  -dname "CN=ZUX Security, OU=FinTech Ops, O=ZUX Agency, L=Cairo, ST=Cairo, C=EG"
