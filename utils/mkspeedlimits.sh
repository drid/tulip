#!/bin/bash
echo "Generating speed limits"
for sl in {5..180..5}
do 
    echo "Speed limit $sl"
    cat src/svg/template-speed-limit.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl.svg
    cat src/svg/template-speed-limit-end.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl-end.svg
done
