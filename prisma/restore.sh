#!/usr/bin/sh
if [ -f "dev.db" ]; then
    rm dev.db
fi
sqlite3 dev.db < songs.sql

