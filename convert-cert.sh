#!/bin/bash
DER_CERT_FILE=burp-ca-cert.der 
DER_KEY_FILE=burp-ca-key.der
PEM_CERT_FILE=cert.pem 
PEM_KEY_FILE=key.pem

read -p "openssl x509 -inform der -in $DER_CERT_FILE -out $PEM_CERT_FILE" answer
openssl x509 -inform der -in $DER_CERT_FILE -out $PEM_CERT_FILE

read -p "openssl rsa -inform der -in $DER_KEY_FILE -out $PEM_KEY_FILE" answer
openssl rsa -inform der -in $DER_KEY_FILE -out $PEM_KEY_FILE
