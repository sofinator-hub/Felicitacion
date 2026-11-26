
import numpy as np
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


def draw(petals, filename="lotus.png"):
    fig = plt.figure(
        figsize=(10.8, 19.2),
        dpi=100,
        facecolor="#050810"
    )

    ax = fig.add_subplot(111, projection="3d")
    ax.set_facecolor("#050810")

    # Paleta azul y lavanda
    colors = [
        "#A9C9FA",
        "#8FB9F5",
        "#779FDF",
        "#C0D8FF",
        "#91AEE8",
    ]

    for i, petal in enumerate(petals):
        x = petal[:, :, 0]
        y = petal[:, :, 1]
        z = petal[:, :, 2]

        ax.plot_surface(
            x, y, z,
            color=colors[i % len(colors)],
            rstride=1,
            cstride=1,
            linewidth=0,
            antialiased=True,
            shade=True,
            alpha=0.98
        )

    # Cámara
    ax.view_init(elev=27, azim=-55)

    # Acercamiento y encuadre
    ax.set_xlim(-0.85, 0.85)
    ax.set_ylim(-0.85, 0.85)
    ax.set_zlim(-0.05, 1.65)  

    ax.set_box_aspect((1, 1, 1.1))

    ax.set_axis_off()

    # Posición de la flor en el lienzo vertical
    ax.set_position([0.05, 0.27, 0.90, 0.48])

    fig.savefig(
        filename,
        dpi=100,
        facecolor="#050810",
        pad_inches=0
    )

    plt.close(fig)

    print(f"wrote {filename} (1080x1920)")
