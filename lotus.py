
import numpy as np
import json
from render import draw

N = 34
GOLD = np.radians(137.508)


def petal(k, t):
    f = k / (N - 1)
    p = np.clip((t - k * .09) / 1.7, 0, 1)
    p = p * p * (3 - 2 * p)

    L = (1 - .52 * f ** .9) * min(1, 2 * p)

    u = np.linspace(0, 1, 14)[:, None]
    v = np.linspace(-1, 1, 9)

    tilt = np.radians(64 - 56 * f ** .8)
    phi = p * tilt + (.5 - f) * u ** 2 * p

    s = np.cumsum(L * np.sin(phi), 0) / 13
    r = .05 + .3 * (1 - f) ** .5 + s
    z = np.cumsum(L * np.cos(phi), 0) / 13

    w = .36 * L * np.sin(np.pi * (.08 + .92 * u) ** .8)
    cup = .4 * v ** 2 * w

    R = r - np.cos(phi) * cup
    Z = z + np.sin(phi) * cup

    a = k * GOLD

    x = R * np.cos(a) - v * w * np.sin(a)
    y = R * np.sin(a) + v * w * np.cos(a)

    return np.stack([x, y, Z], -1)


def bloom(t):
    return np.stack([petal(k, t) for k in range(N)])


def export_animation():
    times = np.linspace(0, 6, 31)

    animation = {
        "name": "LOTUS",
        "petalCount": N,
        "rows": 14,
        "columns": 9,
        "frames": []
    }

    for t in times:
        geometry = bloom(float(t))

        animation["frames"].append({
            "time": round(float(t), 3),
            "petals": geometry.tolist()
        })

    with open(
        "public/lotus-animation.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(animation, file, separators=(",", ":"))

    print("Animación exportada: 31 frames, 34 pétalos")


if __name__ == "__main__":
    export_animation()
    draw(bloom(6), "lotus.png")
