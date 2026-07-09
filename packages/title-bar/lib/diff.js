const EditToken = Object.freeze({
  NOOP: 0,
  DELETE: 1,
  INSERT: 2,
  REPLACE: 3,
});

class Diff {
  constructor(a, b, eqlFn = (a, b) => a === b) {
    this.a = a;
    this.b = b;
    this.eqlFn = eqlFn;
    this.up = {};
    this.down = {};
    this.moda = new Array(a.length).fill(false);
    this.modb = new Array(b.length).fill(false);

    this.lcs(0, this.a.length, 0, this.b.length);
  }

  createEditScript() {
    let astart = 0;
    let bstart = 0;
    const aend = this.moda.length;
    const bend = this.modb.length;
    const result = [];

    while (astart < aend || bstart < bend) {
      if (astart < aend && bstart < bend) {
        if (!this.moda[astart] && !this.modb[bstart]) {
          result.push(EditToken.NOOP);
          astart++;
          bstart++;
          continue;
        } else if (this.moda[astart] && this.modb[bstart]) {
          result.push(EditToken.REPLACE);
          astart++;
          bstart++;
          continue;
        }
      }

      if (astart < aend && (bstart >= bend || this.moda[astart])) {
        result.push(EditToken.DELETE);
        astart++;
      }

      if (bstart < bend && (astart >= aend || this.modb[bstart])) {
        result.push(EditToken.INSERT);
        bstart++;
      }
    }

    return result;
  }

  lcs(astart, aend, bstart, bend) {
    // separate common head
    while (astart < aend && bstart < bend && this.eqlFn(this.a[astart], this.b[bstart])) {
      astart++;
      bstart++;
    }

    // separate common tail
    while (astart < aend && bstart < bend && this.eqlFn(this.a[aend - 1], this.b[bend - 1])) {
      aend--;
      bend--;
    }

    if (astart === aend) {
      // only insertions
      while (bstart < bend) {
        this.modb[bstart] = true;
        bstart++;
      }
    } else if (bend === bstart) {
      // only deletions
      while (astart < aend) {
        this.moda[astart] = true;
        astart++;
      }
    } else {
      const snake = this.snake(astart, aend, bstart, bend);
      this.lcs(astart, snake.x, bstart, snake.y);
      this.lcs(snake.u, aend, snake.v, bend);
    }
  }

  snake(astart, aend, bstart, bend) {
    const N = aend - astart;
    const M = bend - bstart;

    const kdown = astart - bstart;
    const kup = aend - bend;

    const delta = N - M;
    const deltaOdd = (delta & 1) !== 0;

    this.down[kdown + 1] = astart;
    this.up[kup - 1] = aend;

    const Dmax = (N + M) / 2 + 1;

    for (let D = 0; D <= Dmax; D++) {
      let k, x, y;

      // forward path
      for (k = kdown - D; k <= kdown + D; k += 2) {
        if (k === kdown - D) {
          x = this.down[k + 1]; // this.down
        } else {
          x = this.down[k - 1] + 1; // right
          if (k < kdown + D && this.down[k + 1] >= x) {
            x = this.down[k + 1]; // this.down
          }
        }
        y = x - k;

        while (x < aend && y < bend && this.eqlFn(this.a[x], this.b[y])) {
          x++;
          y++; // diagonal
        }
        this.down[k] = x;

        if (deltaOdd && kup - D < k && k < kup + D && this.up[k] <= this.down[k]) {
          return {
            x: this.down[k],
            y: this.down[k] - k,
            u: this.up[k],
            v: this.up[k] - k,
          };
        }
      }

      // reverse path
      for (k = kup - D; k <= kup + D; k += 2) {
        if (k === kup + D) {
          x = this.up[k - 1]; // this.up
        } else {
          x = this.up[k + 1] - 1; // left
          if (k > kup - D && this.up[k - 1] < x) {
            x = this.up[k - 1]; // this.up
          }
        }
        y = x - k;

        while (x > astart && y > bstart && this.eqlFn(this.a[x - 1], this.b[y - 1])) {
          x--;
          y--; // diagonal
        }
        this.up[k] = x;

        if (!deltaOdd && kdown - D <= k && k <= kdown + D && this.up[k] <= this.down[k]) {
          return {
            x: this.down[k],
            y: this.down[k] - k,
            u: this.up[k],
            v: this.up[k] - k,
          };
        }
      }
    }

    throw new Error("Unexpected state!");
  }
}

module.exports = { Diff, EditToken };
