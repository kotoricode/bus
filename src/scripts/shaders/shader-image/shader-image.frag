#include <uv_pars_fragment>
#include <map_pars_fragment>

void main()
{
	gl_FragColor = texture2D(map, vUv);
	#include <encodings_fragment>
}
