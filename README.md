# Vowel-Chart-Generator
A tool to record vowel sounds and plot them on a chart

## Resources used in my code

1. I copied the algorithm of `find_peaks` from [scipy](https://github.com/scipy/scipy/tree/v1.18.0).
The source code for `find_peaks` can be found [here](https://github.com/scipy/scipy/blob/v1.18.0/scipy/signal/_peak_finding.py#L729-L1010),
however the algorithm for getting the tallest peaks with a minimum distance is implemented in a helper,
which I found [here](https://github.com/scipy/scipy/blob/v1.18.0/scipy/signal/_peak_finding_utils.pyx#L92-L159)

2. The algorithm for isolating formants come from Boersma 1993,
which is hosted on Praat's official website at [this link](https://www.fon.hum.uva.nl/paul/papers/Proceedings_1993.pdf)

