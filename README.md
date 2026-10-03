# Black Box

An AI-agent debugging and replay system that records execution traces,
ranks suspicious steps, and tests whether targeted fixes change outcomes.

## Project Status

Early development — core contracts and implementation are being established.

## Setup

Create a virtual environment and install Python dependencies:

    py -m venv .venv
    .venv\Scripts\Activate.ps1
    python -m pip install -r requirements.txt

## Tests

    python -m pytest
