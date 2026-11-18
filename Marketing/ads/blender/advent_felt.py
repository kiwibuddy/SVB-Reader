"""
Felt Advent family: the 3D shots in AdventFamily3DAd. See ../ADVENT.md.

A family of four (Dad, Mum, Leo, Ana) at the kitchen table around an Advent
wreath, built from simple shapes with needle-felt materials. Rendered with
Cycles on the CPU; no AI imagery. Two shots, animated "on twos" (15 fps, each
image held for two video frames) so it moves like stop-motion:

  open     5.6 s  The first candle lights; the camera pushes into the phone,
                  ending where the app graphic sits in the ad (match cut).
  candles  4.3 s  The other three candles light: Hope, Peace, Joy, Love.

Setup (once):  python3 -m venv .venv && .venv/bin/pip install bpy==5.3.0
Still:         .venv/bin/python advent_felt.py still --out still.png [--res 0.5] [--frame 30 --shot open]
Shot frames:   .venv/bin/python advent_felt.py shot open --out-dir frames/open [--from 1 --to 84]
Writes shot.json next to the frames: frame count, fps, candle timings and,
for "open", where the phone screen lands in the last frame.
"""
import argparse
import json
import math
import os
import random
import sys
import time

import bpy  # noqa: I001 (must come first: it puts addon_utils on the path)
import addon_utils
import bmesh
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 15
SHOTS = {"open": 84, "candles": 65}
# Frame (1-based, 15 fps) at which each candle catches, per shot.
LIGHT_AT = {"open": [6, None, None, None], "candles": [0, 12, 24, 36]}

# --------------------------------------------------------------------------
# Colours: the app's four reading-part colours, Advent purple and rose
# --------------------------------------------------------------------------


def srgb(hexstr):
    h = hexstr.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, 1.0)


CHARCOAL = srgb("#3a4550")  # narrator
RED = srgb("#c0261a")
GREEN = srgb("#0e6b4c")
BLUE = srgb("#1d46a8")
PURPLE = srgb("#6a4c93")
ROSE = srgb("#d88aa8")
SKIN_A = srgb("#e2b08f")
SKIN_B = srgb("#d49a76")
HAIR_DARK = srgb("#4a3123")
HAIR_AUBURN = srgb("#5e3220")
HAIR_BLONDE = srgb("#c99a52")
CREAM = srgb("#efe4cf")
THREAD = srgb("#f6eedc")
WALL = srgb("#e9d9bf")
WOOD = srgb("#9a6a44")
LEAF = srgb("#2f6b3f")
LEAF2 = srgb("#3f7f4a")
BERRY = srgb("#b3261e")
NIGHT = srgb("#1f2f55")
BLACK = srgb("#1a1614")
CHEEK = srgb("#e58f86")

TABLE_Z = 0.75
LUMP = 0.007

# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------


def _principled(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return nt, bsdf


def _set(bsdf, name, value):
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = value


def felt(name, color, emission=0.0, fibres=True):
    """Needle-felted wool: matte, fibrous sheen, fuzzy micro-bump."""
    mat = bpy.data.materials.new(name)
    nt, bsdf = _principled(mat)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    tone = nt.nodes.new("ShaderNodeTexNoise")
    tone.inputs["Scale"].default_value = 9.0
    tone.inputs["Detail"].default_value = 4
    nt.links.new(geo.outputs["Position"], tone.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = tuple(c * 0.86 for c in color[:3]) + (1,)
    ramp.color_ramp.elements[1].color = tuple(min(1, c * 1.14) for c in color[:3]) + (1,)
    nt.links.new(tone.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    _set(bsdf, "Roughness", 0.95)
    _set(bsdf, "Sheen Weight", 1.0)
    _set(bsdf, "Sheen Roughness", 0.5)
    _set(bsdf, "Sheen Tint", (1.0, 0.97, 0.92, 1))
    _set(bsdf, "Specular IOR Level", 0.15)
    _set(bsdf, "Subsurface Weight", 0.08)
    if fibres:
        fine = nt.nodes.new("ShaderNodeTexNoise")
        fine.inputs["Scale"].default_value = 190
        fine.inputs["Detail"].default_value = 12
        fine.inputs["Roughness"].default_value = 0.75
        lump = nt.nodes.new("ShaderNodeTexNoise")
        lump.inputs["Scale"].default_value = 38
        lump.inputs["Detail"].default_value = 6
        for n in (fine, lump):
            nt.links.new(geo.outputs["Position"], n.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMath")
        mix.operation = "MULTIPLY_ADD"
        nt.links.new(fine.outputs["Fac"], mix.inputs[0])
        mix.inputs[1].default_value = 0.7
        nt.links.new(lump.outputs["Fac"], mix.inputs[2])
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.8
        bump.inputs["Distance"].default_value = 0.004
        nt.links.new(mix.outputs[0], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if emission:
        _set(bsdf, "Emission Color", color)
        _set(bsdf, "Emission Strength", emission)
    return mat


def flame_material():
    """A felt flame: orange at the base to pale yellow at the tip, softly glowing."""
    mat = bpy.data.materials.new("flame")
    nt, bsdf = _principled(mat)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.1, (1.0, 0.14, 0.0, 1)
    el[1].position, el[1].color = 0.92, (1.0, 0.56, 0.08, 1)
    mid = ramp.color_ramp.elements.new(0.45)
    mid.color = (1.0, 0.32, 0.01, 1)
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Emission Color"])
    _set(bsdf, "Emission Strength", 1.0)
    _set(bsdf, "Roughness", 0.9)
    _set(bsdf, "Sheen Weight", 0.35)
    _set(bsdf, "Sheen Roughness", 0.5)
    _set(bsdf, "Sheen Tint", (1.0, 0.55, 0.2, 1))
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    fine = nt.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 260
    nt.links.new(geo.outputs["Position"], fine.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    nt.links.new(fine.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def glossy(name, color, rough=0.15):
    mat = bpy.data.materials.new(name)
    nt, bsdf = _principled(mat)
    _set(bsdf, "Base Color", color)
    _set(bsdf, "Roughness", rough)
    return mat


def emissive(name, color, strength):
    mat = bpy.data.materials.new(name)
    nt, bsdf = _principled(mat)
    _set(bsdf, "Base Color", color)
    _set(bsdf, "Emission Color", color)
    _set(bsdf, "Emission Strength", strength)
    return mat


def screen_material(path):
    """The app as the phone shows it: emission at about display brightness, a faint glass sheen."""
    mat = bpy.data.materials.new("screen")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(path)
    img.interpolation = "Cubic"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.3
    nt.links.new(img.outputs["Color"], em.inputs["Color"])
    gl = nt.nodes.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.25
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.035
    nt.links.new(em.outputs["Emission"], mix.inputs[1])
    nt.links.new(gl.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return mat


_cache = {}


def M(key, color, emission=0.0):
    if key not in _cache:
        _cache[key] = felt(key, color, emission)
    return _cache[key]


# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------


def _finish(obj, mat, lumpy=True, smooth=True):
    if smooth and obj.type == "MESH":
        for p in obj.data.polygons:
            p.use_smooth = True
    obj.data.materials.append(mat)
    if lumpy:
        tex = bpy.data.textures.get("lump") or bpy.data.textures.new("lump", "CLOUDS")
        tex.noise_scale = 0.12
        d = obj.modifiers.new("lump", "DISPLACE")
        d.texture = tex
        d.texture_coords = "GLOBAL"
        d.strength = LUMP
        d.mid_level = 0.5
    return obj


def sphere(name, loc, scale, mat, lumpy=True, segs=48, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=segs // 2, radius=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    if parent:
        o.parent = parent
    return _finish(o, mat, lumpy)


def cylinder(name, loc, radius, depth, mat, rot=(0, 0, 0), lumpy=False, verts=48, bevel=0.0, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if parent:
        o.parent = parent
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 4
        b.limit_method = "ANGLE"
    return _finish(o, mat, lumpy)


def box(name, loc, size, mat, rot=(0, 0, 0), bevel=0.01, lumpy=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 5
    return _finish(o, mat, lumpy, smooth=True)


def limb(name, p1, p2, radius, mat, parent=None):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    o = sphere(name, (p1 + p2) / 2, (radius, radius, d.length / 2 + radius * 0.6), mat, parent=parent)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return o


def mesh_object(name, bm, mat, parent=None, lumpy=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    return _finish(o, mat, lumpy)


def hair_cap(name, center, r, mat, fringe, bottom, parent=None):
    """Base layer under the tufts: a shell around the head with the face cut out."""
    rh = r * 1.03
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=rh)
    kill = [f for f in bm.faces
            if (f.calc_center_median().y < -0.2 * rh and f.calc_center_median().z < fringe * rh)
            or f.calc_center_median().z < bottom * rh]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bmesh.ops.translate(bm, vec=Vector(center), verts=bm.verts)
    o = mesh_object(name, bm, mat, parent)
    s = o.modifiers.new("solid", "SOLIDIFY")
    s.thickness = 0.016
    s.offset = 1
    o.modifiers.move(len(o.modifiers) - 1, 0)
    return o


def _tuft(bm, at, normal, size, rng):
    ico = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    q = normal.to_track_quat("Z", "Y") @ Quaternion((0, 0, 1), rng.uniform(0, math.tau))
    m = (Matrix.Translation(at) @ q.to_matrix().to_4x4()
         @ Matrix.Diagonal((size * rng.uniform(0.85, 1.2), size * rng.uniform(0.7, 1.0), size * 0.62, 1)))
    bmesh.ops.transform(bm, matrix=m, verts=ico["verts"])


def tufted_hair(name, center, r, mat, fringe, bottom, size, count=300, clusters=(), seed=1, parent=None):
    """Fluffy felt hair: many soft wool tufts over the scalp, plus optional bun or bunches."""
    rng = random.Random(seed)
    bm = bmesh.new()
    rh = r * 1.06
    c = Vector(center)
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(count):
        z = 1 - 2 * (i + 0.5) / count
        rad = math.sqrt(1 - z * z)
        th = golden * i
        n = Vector((math.cos(th) * rad, math.sin(th) * rad, z))
        p = n * rh
        if (p.y < -0.2 * rh and p.z < fringe * rh) or p.z < bottom * rh:
            continue
        jitter = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * 0.006
        _tuft(bm, c + p + jitter, n, size, rng)
    for (cc, radius, n_tufts) in clusters:
        cc = Vector(cc)
        for i in range(n_tufts):
            z = 1 - 2 * (i + 0.5) / n_tufts
            rad = math.sqrt(1 - z * z)
            th = golden * i
            n = Vector((math.cos(th) * rad, math.sin(th) * rad, z))
            _tuft(bm, cc + Vector((n.x * radius[0], n.y * radius[1], n.z * radius[2])), n, size * 0.9, rng)
    return mesh_object(name, bm, mat, parent)


def stitch_ring(name, p1, p2, limb_r, t, count, mat, parent, gap=0.45):
    """A ring of running stitches around a limb, t along it from p1 (0) to p2 (1)."""
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    axis = d.normalized()
    half = d.length / 2 + limb_r * 0.6
    along = (t - 0.5) * d.length
    ring_r = limb_r * math.sqrt(max(1 - (along / half) ** 2, 0.05)) + 0.004
    u = axis.orthogonal().normalized()
    v = axis.cross(u).normalized()
    centre = p1 + axis * (t * d.length)
    arc = math.tau / count
    for k in range(count):
        a = k * arc
        pos = centre + (u * math.cos(a) + v * math.sin(a)) * ring_r
        tangent = -u * math.sin(a) + v * math.cos(a)
        st = sphere(f"{name}{k}", pos, (0.0045, 0.0045, ring_r * arc * (1 - gap) / 2), mat, lumpy=False, segs=12,
                    parent=parent)
        st.rotation_mode = "QUATERNION"
        st.rotation_quaternion = tangent.to_track_quat("Z", "Y")


def teardrop(name, mat):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
    for v in bm.verts:
        z = v.co.z
        if z > 0:
            k = 1 - 0.92 * z ** 1.3
            v.co.x *= k
            v.co.y *= k
            v.co.z = z * 1.9
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return _finish(o, mat, lumpy=False)


# --------------------------------------------------------------------------
# Characters
# --------------------------------------------------------------------------

PEOPLE = {}


def person(name, pos, facing_deg, size, jumper, skin, hair, style, kid=False):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = pos
    root.rotation_euler = (0, 0, math.radians(facing_deg))
    root.scale = (size, size, size)

    j = M(f"jumper_{name}", jumper)
    sk = M(f"skin_{name}", skin)
    hr = M(f"hair_{name}", hair)
    hr_under = M(f"hairbase_{name}", tuple(c * 0.8 for c in hair[:3]) + (1,))
    eye = glossy("eye", BLACK, 0.08)
    stitch_dark = M("stitch", BLACK)
    thread = M("thread", THREAD)
    cheek = M("cheek", CHEEK)

    head_r = 0.165 if kid else 0.15
    torso_h = 0.2 if kid else 0.22
    hz = 0.84 + torso_h + head_r * 0.72
    head_parts = []

    sphere(f"{name}_torso", (0, 0, 0.84), (0.17, 0.13, torso_h), j, parent=root)
    collar_z = 0.84 + torso_h * 0.9
    bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.022, location=(0, 0, collar_z))
    collar = bpy.context.object
    collar.name = f"{name}_collar"
    collar.parent = root
    _finish(collar, j)
    # Blanket stitch around the collar edge.
    for k in range(16):
        a = k / 16 * math.tau
        st = sphere(f"{name}_collarstitch{k}", (math.cos(a) * 0.094, math.sin(a) * 0.094, collar_z),
                    (0.0045, 0.0045, 0.014), thread, lumpy=False, segs=12, parent=root)
    for sx in (-1, 1):
        sh = (0.15 * sx, 0.0, 0.84 + torso_h * 0.55)
        el = (0.17 * sx, -0.1, 0.80)
        hand = (0.07 * sx, -0.27, 0.79)
        limb(f"{name}_upper{sx}", sh, el, 0.048, j, parent=root)
        limb(f"{name}_fore{sx}", el, hand, 0.044, j, parent=root)
        sphere(f"{name}_hand{sx}", hand, (0.042, 0.04, 0.032), sk, parent=root)
        # Seams where a felt maker joins the pieces: shoulder and cuff.
        stitch_ring(f"{name}_shoulder{sx}_", sh, el, 0.048, 0.18, 11, thread, root)
        stitch_ring(f"{name}_cuff{sx}_", el, hand, 0.044, 0.8, 10, thread, root)

    head_parts.append(sphere(f"{name}_head", (0, 0, hz), (head_r, head_r * 0.96, head_r), sk, parent=root))
    ey = -math.sqrt(head_r ** 2 - 0.05 ** 2 - 0.02 ** 2) + 0.004
    eyes = []
    for sx in (-1, 1):
        e = sphere(f"{name}_eye{sx}", (0.05 * sx, ey, hz + 0.02), (0.017, 0.012, 0.019), eye, lumpy=False, segs=24,
                   parent=root)
        eyes.append(e)
        head_parts.append(e)
        head_parts.append(sphere(f"{name}_cheek{sx}", (0.085 * sx, ey + 0.022, hz - 0.03), (0.026, 0.01, 0.018),
                                 cheek, lumpy=False, segs=24, parent=root))
    head_parts.append(sphere(f"{name}_nose", (0, ey - 0.008, hz - 0.008), (0.016, 0.014, 0.014), sk, lumpy=False,
                             segs=24, parent=root))
    for i in range(7):
        t = (i - 3) / 3
        x = 0.032 * t
        z = hz - 0.058 + 0.014 * t * t
        y = -math.sqrt(max(head_r ** 2 - x ** 2 - (z - hz) ** 2, 0.0001)) + 0.003
        head_parts.append(sphere(f"{name}_smile{i}", (x, y, z), (0.0065, 0.004, 0.0045), stitch_dark, lumpy=False,
                                 segs=16, parent=root))

    hc = (0, 0, hz)
    if style == "dad":
        head_parts.append(hair_cap(f"{name}_hair", hc, head_r, hr_under, fringe=0.5, bottom=-0.22, parent=root))
        head_parts.append(tufted_hair(f"{name}_tufts", hc, head_r, hr, 0.52, -0.2, 0.026, count=320, seed=11,
                                      parent=root))
        rim = glossy("glasses", BLACK, 0.25)
        for sx in (-1, 1):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.0045,
                                             location=(0.05 * sx, ey - 0.012, hz + 0.02), rotation=(math.radians(90), 0, 0))
            g = bpy.context.object
            g.parent = root
            head_parts.append(_finish(g, rim, lumpy=False))
        head_parts.append(cylinder(f"{name}_bridge", (0, ey - 0.014, hz + 0.024), 0.004, 0.04, rim,
                                   rot=(0, math.radians(90), 0), parent=root))
    elif style == "mum":
        head_parts.append(hair_cap(f"{name}_hair", hc, head_r, hr_under, fringe=0.42, bottom=-0.68, parent=root))
        bun = (0, 0.1, hz + head_r * 0.95)
        head_parts.append(tufted_hair(f"{name}_tufts", hc, head_r, hr, 0.44, -0.66, 0.034, count=300, seed=12,
                                      clusters=[(bun, (0.06, 0.055, 0.05), 40)], parent=root))
    elif style == "son":
        head_parts.append(hair_cap(f"{name}_hair", hc, head_r, hr_under, fringe=0.4, bottom=-0.1, parent=root))
        head_parts.append(tufted_hair(f"{name}_tufts", hc, head_r, hr, 0.42, -0.08, 0.032, count=260, seed=13,
                                      parent=root))
    elif style == "daughter":
        head_parts.append(hair_cap(f"{name}_hair", hc, head_r, hr_under, fringe=0.4, bottom=-0.35, parent=root))
        bunches = [((0.19 * sx, 0.04, hz - 0.03), (0.05, 0.045, 0.075), 30) for sx in (-1, 1)]
        head_parts.append(tufted_hair(f"{name}_tufts", hc, head_r, hr, 0.42, -0.33, 0.032, count=260, seed=14,
                                      clusters=bunches, parent=root))
        ribbon = M("ribbon", BLUE)
        for sx in (-1, 1):
            head_parts.append(sphere(f"{name}_bow{sx}", (0.165 * sx, 0.02, hz + 0.045), (0.03, 0.02, 0.024), ribbon,
                                     parent=root))

    # A pivot at the neck so the head can nod and turn.
    neck = bpy.data.objects.new(f"{name}_neck", None)
    bpy.context.collection.objects.link(neck)
    neck.parent = root
    neck.location = (0, 0, hz - head_r * 0.85)
    bpy.context.view_layer.update()
    for o in head_parts:
        mw = o.matrix_world.copy()
        o.parent = neck
        o.matrix_world = mw
    PEOPLE[name] = {"root": root, "neck": neck, "eyes": eyes, "base": root.location.copy(),
                    "eye_scale": [e.scale.copy() for e in eyes]}
    return root


# --------------------------------------------------------------------------
# Scene
# --------------------------------------------------------------------------

CANDLES = []  # {"flame": obj, "core": obj, "light": obj, "base": Vector}


def build(screen_path):
    random.seed(7)
    box("floor", (0, 0.5, -0.01), (8, 8, 0.02), M("floor", WOOD), bevel=0)
    box("wall", (0, 1.9, 1.6), (6, 0.05, 3.4), M("wall", WALL), bevel=0)

    box("window_sky", (-0.75, 1.86, 2.0), (0.9, 0.02, 0.8), M("night", NIGHT, emission=0.35), bevel=0)
    frame = M("frame", CREAM)
    for (x, z, w, h) in ((-0.75, 2.41, 1.0, 0.07), (-0.75, 1.59, 1.0, 0.07), (-1.22, 2.0, 0.07, 0.86),
                         (-0.28, 2.0, 0.07, 0.86), (-0.75, 2.0, 0.04, 0.8), (-0.75, 2.0, 0.9, 0.04)):
        box(f"frame_{x}_{z}", (x, 1.84, z), (w, 0.05, h), frame, bevel=0.01, lumpy=True)
    star = emissive("star", (1.0, 0.92, 0.7, 1), 6)
    for i in range(9):
        sphere(f"star{i}", (-0.75 + random.uniform(-0.4, 0.4), 1.845, 2.0 + random.uniform(-0.35, 0.35)),
               (0.008, 0.004, 0.008), star, lumpy=False, segs=12)

    banner = M("banner", CREAM)
    box("banner", (0.85, 1.86, 1.95), (0.7, 0.02, 0.85), banner, bevel=0.01, lumpy=True)
    pocket_cols = [RED, GREEN, CREAM, BLUE]
    for r_ in range(4):
        for c_ in range(5):
            col = pocket_cols[(r_ + c_) % 4]
            box(f"pocket{r_}{c_}", (0.85 - 0.26 + c_ * 0.13, 1.84, 2.25 - r_ * 0.18), (0.1, 0.02, 0.11),
                M(f"pocket{(r_ + c_) % 4}", col), bevel=0.012, lumpy=True)

    bulb = emissive("bulb", (1.0, 0.72, 0.38, 1), 25)
    for i in range(26):
        x = -1.7 + i * 0.135
        z = 2.5 - 0.1 * math.sin(math.pi * ((x + 1.7) % 1.17) / 1.17)
        sphere(f"bulb{i}", (x, 1.82, z), (0.016, 0.016, 0.022), bulb, lumpy=False, segs=16)

    cylinder("table", (0, 0.1, TABLE_Z - 0.03), 0.58, 0.05, M("wood", WOOD), bevel=0.012, verts=96)
    cylinder("leg", (0, 0.1, TABLE_Z / 2), 0.07, TABLE_Z, M("wood", WOOD), lumpy=True)
    cylinder("foot", (0, 0.1, 0.02), 0.3, 0.04, M("wood", WOOD), lumpy=True, bevel=0.01)
    cylinder("cloth", (0, 0.1, TABLE_Z), 0.46, 0.012, M("cloth", CREAM), verts=96, lumpy=True)

    # Advent wreath: candles Hope, Peace, Joy (rose), Love, lit in that order.
    wc = Vector((0, 0.12, TABLE_Z + 0.02))
    leaf_mats = [M("leaf", LEAF), M("leaf2", LEAF2)]
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.035, location=wc)
    _finish(bpy.context.object, leaf_mats[0])
    for i in range(46):
        a = i / 46 * math.tau + random.uniform(-0.05, 0.05)
        rr = 0.17 + random.uniform(-0.035, 0.035)
        p = wc + Vector((math.cos(a) * rr, math.sin(a) * rr, random.uniform(0.01, 0.04)))
        lf = sphere(f"leaf{i}", p, (0.045, 0.018, 0.007), leaf_mats[i % 2], lumpy=False, segs=24)
        lf.rotation_euler = (random.uniform(-0.6, 0.6), random.uniform(-0.4, 0.4),
                             a + math.pi / 2 + random.uniform(-0.5, 0.5))
    for i in range(12):
        a = i / 12 * math.tau + 0.2
        rr = 0.17 + random.uniform(-0.03, 0.03)
        sphere(f"berry{i}", wc + Vector((math.cos(a) * rr, math.sin(a) * rr, 0.045)), (0.013, 0.013, 0.013),
               M("berry", BERRY), lumpy=False, segs=20)
    fmat = flame_material()
    core_mat = emissive("flame_core", (1.0, 0.8, 0.42, 1), 2.4)
    for i, (deg, col) in enumerate(zip([225, 315, 45, 135], [PURPLE, PURPLE, ROSE, PURPLE])):
        a = math.radians(deg)
        base = wc + Vector((math.cos(a) * 0.17, math.sin(a) * 0.17, 0.03))
        h = 0.16
        cylinder(f"candle{i}", base + Vector((0, 0, h / 2)), 0.027, h, M(f"candle{i}", col), lumpy=True, bevel=0.006)
        cylinder(f"wick{i}", base + Vector((0, 0, h + 0.008)), 0.003, 0.018, glossy("wick", BLACK, 0.6))
        flame = teardrop(f"flame{i}", fmat)
        core = teardrop(f"core{i}", core_mat)
        flame.visible_shadow = False  # let the candle light through its own flame
        core.visible_shadow = False
        bpy.ops.object.light_add(type="POINT", location=base + Vector((0, 0, h + 0.05)))
        light = bpy.context.object
        light.data.color = (1.0, 0.62, 0.28)
        light.data.shadow_soft_size = 0.02
        CANDLES.append({"flame": flame, "core": core, "light": light, "tip": base + Vector((0, 0, h + 0.014))})

    # Phone on a little stand, showing the real app.
    phone_loc = Vector((0.1, -0.36, TABLE_Z + 0.09))
    phone_rot = (math.radians(70), 0, math.radians(-6))
    box("stand", (0.1, -0.3, TABLE_Z + 0.04), (0.15, 0.08, 0.08), M("stand", srgb("#b07a4a")), bevel=0.012, lumpy=True)
    box("phone", phone_loc, (0.13, 0.26, 0.013), glossy("phone_body", (0.04, 0.045, 0.05, 1), 0.3),
        rot=phone_rot, bevel=0.008)
    holder = bpy.data.objects.new("phone_holder", None)
    bpy.context.collection.objects.link(holder)
    holder.location = phone_loc
    holder.rotation_euler = phone_rot
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    scr = bpy.context.object
    scr.name = "screen"
    scr.scale = (0.12, 0.248, 1)
    scr.location = (0, 0, 0.0068)
    scr.parent = holder
    scr.data.materials.append(screen_material(screen_path))

    cylinder("mug", (-0.3, -0.2, TABLE_Z + 0.06), 0.045, 0.1, M("mug", RED), lumpy=True, bevel=0.01)
    cylinder("plate", (0.33, -0.08, TABLE_Z + 0.008), 0.11, 0.012, M("plate", CREAM), lumpy=True)
    for i in range(4):
        a = i * 1.6
        cylinder(f"biscuit{i}", (0.33 + math.cos(a) * 0.05, -0.08 + math.sin(a) * 0.05, TABLE_Z + 0.022), 0.03,
                 0.012, M("biscuit", srgb("#c8904f")), lumpy=True)

    def around(angle_deg, radius, turn=0.72):
        a = math.radians(angle_deg)
        x, y = math.cos(a) * radius, 0.1 + math.sin(a) * radius
        return (x, y, 0), math.degrees(math.atan2(-x, y - 0.1)) * turn

    p, t = around(148, 0.68)
    person("dad", p, t, 1.0, CHARCOAL, SKIN_B, HAIR_DARK, "dad")
    p, t = around(110, 0.66)
    person("leo", (p[0], p[1], 0.02), t, 0.8, GREEN, SKIN_B, HAIR_DARK, "son", kid=True)
    p, t = around(70, 0.66)
    person("ana", (p[0], p[1], 0.02), t, 0.78, BLUE, SKIN_A, HAIR_BLONDE, "daughter", kid=True)
    p, t = around(32, 0.68)
    person("mum", p, t, 0.97, RED, SKIN_A, HAIR_AUBURN, "mum")

    add_fuzz()

    world = bpy.data.worlds.new("world")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.12, 0.1, 0.09, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
    area("pendant", (0.1, 0.2, 2.9), (0, 0.2, 0.8), 260, 1.2, (1.0, 0.8, 0.6))
    area("fill", (-1.8, -1.6, 1.8), (0, 0.2, 1.0), 70, 1.5, (1.0, 0.9, 0.82))
    area("rim", (1.4, 1.5, 1.9), (0, 0.4, 1.1), 90, 0.8, (0.62, 0.72, 1.0))
    return scr


def fuzz_material(base_mat, threshold):
    mat = base_mat.copy()
    mat.name = base_mat.name + f"_fuzz{threshold}"
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 520
    n.inputs["Detail"].default_value = 2
    nt.links.new(geo.outputs["Position"], n.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = threshold
    ramp.color_ramp.elements[1].position = threshold + 0.04
    nt.links.new(n.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Alpha"])
    return mat


def add_fuzz():
    """Fuzzy edges: thin, mostly transparent fibre shells. They cast no shadow, so no dark outlines."""
    keys = ("_torso", "_head", "_tufts", "_upper", "_fore", "_collar")
    for o in list(bpy.data.objects):
        if o.type != "MESH" or not any(k in o.name for k in keys) or "stitch" in o.name:
            continue
        for i, (offset, thr) in enumerate(((0.004, 0.56), (0.009, 0.66))):
            c = o.copy()
            c.data = o.data.copy()
            bpy.context.collection.objects.link(c)
            c.name = f"{o.name}_fuzz{i}"
            d = c.modifiers.new("shell", "DISPLACE")
            d.direction = "NORMAL"
            d.mid_level = 0.0
            d.strength = offset / max(min(c.scale), 0.01)
            c.visible_shadow = False
            c.data.materials.clear()
            c.data.materials.append(fuzz_material(o.data.materials[0], thr))


def area(name, loc, target, power, size, color):
    bpy.ops.object.light_add(type="AREA", location=loc)
    lt = bpy.context.object
    lt.name = name
    lt.data.energy = power
    lt.data.size = size
    lt.data.color = color
    lt.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return lt


# --------------------------------------------------------------------------
# Camera and animation
# --------------------------------------------------------------------------

LENS = 25.0
WIDE = (Vector((0.0, -1.32, 1.42)), Vector((0.0, 0.3, 1.02)))
WIDE_IN = (Vector((0.0, -1.22, 1.39)), Vector((0.0, 0.29, 1.0)))
CANDLES_END = (Vector((0.0, -1.1, 1.34)), Vector((0.0, 0.26, 0.98)))
FAMILY_FOCUS = Vector((0.0, 0.22, 0.9))

# Where the app graphic sits in the ad (Phone.tsx at rest): screen 718 px wide,
# centred, its centre 1266 px from the top of a 1920 px frame.
AD_SCREEN_W_PX, AD_SCREEN_CY_PX = 718, 1266


def look(loc, target, up=None):
    d = target - loc
    q = d.to_track_quat("-Z", "Y")
    if up is not None:
        q = d.to_track_quat("-Z", "Y")
        # Roll so the camera's up matches the given up vector.
        cam_up = q @ Vector((0, 1, 0))
        fwd = d.normalized()
        want = (up - fwd * up.dot(fwd)).normalized()
        angle = math.atan2(fwd.dot(cam_up.cross(want)), cam_up.dot(want))
        q = Quaternion(fwd, angle) @ q
    return q


def phone_closeup(scr):
    """Camera pose that frames the felt phone's screen exactly like the ad's phone graphic."""
    bpy.context.view_layer.update()
    mw = scr.matrix_world
    centre = mw @ Vector((0, 0, 0))
    normal = (mw.to_3x3() @ Vector((0, 0, 1))).normalized()
    up = (mw.to_3x3() @ Vector((0, 1, 0))).normalized()
    width = (mw.to_3x3() @ Vector((1, 0, 0))).length  # plane is 1 unit, scaled
    tan_v = 18.0 / LENS
    tan_h = tan_v * 1080 / 1920
    half_w = (width / 2) * 1080 / AD_SCREEN_W_PX
    dist = half_w / tan_h
    half_h = dist * tan_v
    offset = (AD_SCREEN_CY_PX - 960) / 960 * half_h  # frame centre sits above the screen centre
    loc = centre + normal * dist + up * offset
    return loc, look(loc, loc - normal, up), centre


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def set_camera(cam, loc, rot_q, focus_point, fstop):
    cam.location = loc
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = rot_q
    cam.data.dof.focus_distance = (focus_point - loc).length
    cam.data.dof.aperture_fstop = fstop


def pose(shot, f, cam, scr, closeup):
    """Set everything for frame f (1-based, 15 fps) of a shot."""
    rng = random.Random(f * 7919 + (0 if shot == "open" else 104729))
    n = SHOTS[shot]

    # Camera.
    if shot == "open":
        if f <= 40:
            k = smooth((f - 1) / 39)
            loc = WIDE[0].lerp(WIDE_IN[0], k)
            q = look(WIDE[0], WIDE[1]).slerp(look(WIDE_IN[0], WIDE_IN[1]), k)
            set_camera(cam, loc, q, FAMILY_FOCUS, 1.6)
        else:
            k = smooth((f - 40) / (n - 40))
            loc_c, q_c, centre = closeup
            loc = WIDE_IN[0].lerp(loc_c, k)
            q = look(WIDE_IN[0], WIDE_IN[1]).slerp(q_c, k)
            focus = FAMILY_FOCUS.lerp(centre, smooth(k * 1.6))
            set_camera(cam, loc, q, focus, 1.6 + 6.4 * k)
    else:
        k = smooth((f - 1) / (n - 1))
        loc = WIDE[0].lerp(CANDLES_END[0], k)
        q = look(WIDE[0], WIDE[1]).slerp(look(CANDLES_END[0], CANDLES_END[1]), k)
        set_camera(cam, loc, q, FAMILY_FOCUS.lerp(Vector((0, 0.14, 0.92)), k), 1.6)
    # Stop-motion camera: the rig is nudged by hand between frames.
    cam.location += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * 0.0006

    # Candles.
    for i, c in enumerate(CANDLES):
        at = LIGHT_AT[shot][i]
        grow = 0.0 if at is None else smooth((f - at) / 4) if f >= at else 0.0
        overshoot = 1 + 0.18 * math.sin(math.pi * min(1, max(0, (f - (at or 0)) / 5))) if at is not None and f >= at else 1
        flick = 1 + rng.uniform(-0.07, 0.07)
        sx = 0.0135 * grow * flick
        sz = 0.022 * grow * overshoot * (1 + rng.uniform(-0.1, 0.1))
        lean = rng.uniform(-0.09, 0.09)
        for obj, s in ((c["flame"], 1.0), (c["core"], 0.45)):
            obj.scale = (max(sx * s, 1e-5), max(sx * s, 1e-5), max(sz * s, 1e-5))
            obj.location = c["tip"] + Vector((0, 0, sz * s * 0.95))
            obj.rotation_euler = (lean * 0.6, lean, 0)
        c["light"].data.energy = 5.5 * grow * (0.88 + rng.uniform(0, 0.24))

    # Family: slow nods, a blink each, and a little hand-animated boil.
    blinks = {"open": {"dad": 22, "mum": 34, "leo": 47, "ana": 15}, "candles": {"dad": 30, "mum": 9, "leo": 20, "ana": 44}}
    for i, (name, p) in enumerate(PEOPLE.items()):
        ph = i * 1.7
        t = f / FPS
        p["neck"].rotation_euler = (math.radians(2.2 * math.sin(t * 1.3 + ph)), 0,
                                    math.radians(2.8 * math.sin(t * 0.9 + ph * 1.3)))
        p["root"].location = p["base"] + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)) * 0.0007
        shut = blinks[shot].get(name) == f
        for e, s0 in zip(p["eyes"], p["eye_scale"]):
            e.scale = (s0.x, s0.y, s0.z * (0.15 if shut else 1.0))


def setup_render(res, samples):
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = samples
    s.cycles.use_adaptive_sampling = True
    s.cycles.adaptive_threshold = 0.03
    s.cycles.max_bounces = 6
    s.cycles.diffuse_bounces = 2
    s.cycles.glossy_bounces = 2
    s.cycles.transmission_bounces = 2
    s.cycles.transparent_max_bounces = 8
    s.cycles.caustics_reflective = False
    s.cycles.caustics_refractive = False
    s.cycles.use_denoising = True
    try:
        s.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception as e:  # noqa: BLE001
        print("denoiser:", e)
    s.render.use_persistent_data = True
    s.render.resolution_x = int(1080 * res)
    s.render.resolution_y = int(1920 * res)
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGB"
    s.view_settings.view_transform = "AgX"
    s.view_settings.look = "AgX - Medium High Contrast"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["still", "shot"])
    ap.add_argument("shot", nargs="?", default="open", choices=list(SHOTS))
    ap.add_argument("--out")
    ap.add_argument("--out-dir")
    ap.add_argument("--frame", type=int, default=30)
    ap.add_argument("--from", dest="start", type=int, default=1)
    ap.add_argument("--to", dest="end", type=int)
    ap.add_argument("--res", type=float, default=1.0)
    ap.add_argument("--samples", type=int, default=40)
    a = ap.parse_args()

    addon_utils.enable("cycles", default_set=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    screen = os.path.join(HERE, "screens", "plan.png" if a.shot == "open" else "read.png")
    scr = build(screen)
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    bpy.context.scene.camera = cam
    cam.data.lens = LENS
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 36
    cam.data.dof.use_dof = True
    closeup = phone_closeup(scr)
    setup_render(a.res, a.samples)

    if a.mode == "still":
        pose(a.shot, a.frame, cam, scr, closeup)
        bpy.context.scene.render.filepath = a.out
        bpy.ops.render.render(write_still=True)
        print("WROTE", a.out)
        return

    os.makedirs(a.out_dir, exist_ok=True)
    end = a.end or SHOTS[a.shot]
    for f in range(a.start, end + 1):
        t0 = time.time()
        pose(a.shot, f, cam, scr, closeup)
        bpy.context.scene.render.filepath = os.path.join(a.out_dir, f"{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"FRAME {f}/{end} {time.time() - t0:.1f}s", flush=True)

    meta = {"shot": a.shot, "frames": SHOTS[a.shot], "fps": FPS, "lightAt": LIGHT_AT[a.shot]}
    if a.shot == "open":
        pose(a.shot, SHOTS["open"], cam, scr, closeup)
        bpy.context.view_layer.update()
        corners = []
        for x, y in ((-0.5, 0.5), (0.5, 0.5), (0.5, -0.5), (-0.5, -0.5)):
            v = world_to_camera_view(bpy.context.scene, cam, scr.matrix_world @ Vector((x, y, 0)))
            corners.append([round(v.x * 1080, 1), round((1 - v.y) * 1920, 1)])
        meta["screenCorners"] = corners
    with open(os.path.join(a.out_dir, "shot.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
    print("WROTE", os.path.join(a.out_dir, "shot.json"))


if __name__ == "__main__":
    sys.exit(main())
