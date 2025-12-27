#!/usr/bin/env python

import os
import binascii


if __name__ == "__main__":
    print(binascii.hexlify(os.urandom(24)))
