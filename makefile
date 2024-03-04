# Makefile

# Variables
TS_FILE = scripts/sketch.ts
JS_FILE = scripts/compiled/sketch.js
HTML_FILE = index.html

# Default target
all: compile open

# Compile TypeScript to JavaScript
compile:
	tsc $(TS_FILE)

# Open HTML file in the default browser
open:
	@if pgrep -f "firefox.*$(HTML_FILE)" > /dev/null ; then \
		echo "Reloading $(HTML_FILE)"; \
	else \
		firefox $(HTML_FILE) & \
	fi
