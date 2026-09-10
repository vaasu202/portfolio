// World-space atmospheric volume. The camera basis is shared with Three.js.
fn hash3(p: vec3f) -> f32 {
  var q = fract(p * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
fn noise3(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3f(1,0,0)), u.x),
                 mix(hash3(i + vec3f(0,1,0)), hash3(i + vec3f(1,1,0)), u.x), u.y),
             mix(mix(hash3(i + vec3f(0,0,1)), hash3(i + vec3f(1,0,1)), u.x),
                 mix(hash3(i + vec3f(0,1,1)), hash3(i + vec3f(1,1,1)), u.x), u.y), u.z);
}
fn extinction(density: f32, step: f32) -> f32 { return exp(-density * step); }
fn camera_ray(uv: vec2f, aspect: f32, lens: f32, right: vec3f, up: vec3f, forward: vec3f) -> vec3f {
  let p = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  return normalize(forward + right * p.x * aspect * lens + up * p.y * lens);
}
struct Camera {
  origin: vec3f, time: f32,
  right: vec3f, lens: f32,
  up: vec3f, aspect: f32,
  forward: vec3f, debug: f32,
}
@group(0) @binding(0) var<uniform> camera: Camera;
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let ray = camera_ray(uv, camera.aspect, camera.lens, camera.right, camera.up, camera.forward);
  let sun = normalize(vec3f(0.5, 0.45, -0.75));
  let alignment = max(dot(ray, sun), 0.0);
  let horizon = exp(-abs(ray.y + 0.03) * 4.0);
  var color = mix(vec3f(0.055, 0.095, 0.08), vec3f(0.26, 0.32, 0.27), horizon);
  color += vec3f(0.5, 0.43, 0.27) * pow(alignment, 22.0) * 0.35;
  var transmittance = 1.0;
  var light = vec3f(0.0);
  for (var i = 0; i < 20; i++) {
    let distance = 8.0 + f32(i) * 3.6;
    let p = camera.origin + ray * distance;
    let wind = vec3f(camera.time * 0.055, 0, camera.time * 0.024);
    let cloud = noise3(p * vec3f(0.05, 0.16, 0.05) + wind) * 0.7 + noise3(p * 0.12 + wind) * 0.3;
    let layer = exp(-pow((p.y - 6.0) / 10.0, 2.0));
    let density = smoothstep(0.36, 0.8, cloud) * layer * 0.028;
    let absorbed = 1.0 - extinction(density, 3.6);
    light += transmittance * absorbed * mix(vec3f(0.21, 0.28, 0.24), vec3f(0.57, 0.57, 0.41), pow(alignment, 4.0));
    transmittance *= 1.0 - absorbed;
  }
  color = color * transmittance + light;
  // Soft optical falloff rather than decorative screen-space particles.
  color *= 1.0 - 0.17 * dot(uv - 0.5, uv - 0.5);
  return vec4f(color, 1.0);
}
