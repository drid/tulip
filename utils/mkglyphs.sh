#!/bin/bash
echo "Generating speed limits"
for sl in {5..180..5}
do 
    echo "Speed limit $sl"
    cat src/svg/template-speed-limit.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl.svg
    cat src/svg/template-speed-limit-end.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl-end.svg
done

echo "Generating distances"
for d in {25..400..25}
do 
    echo "Distance $d"
    cat src/svg/template-distance.svg| sed "s/>999m</>$d</" > src/svg/glyphs/distance$d.svg
done