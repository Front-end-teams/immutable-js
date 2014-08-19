/**
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import "Sequence"
import "Map"
/* global Sequence, IndexedSequence, Map */
/* exported Set */


class Set extends Sequence {

  // @pragma Construction

  constructor(...values) {
    return Set.from(values);
  }

  static empty() {
    return EMPTY_SET || (EMPTY_SET = makeSet());
  }

  static from(sequence) {
    if (sequence && sequence.constructor === Set) {
      return sequence;
    }
    if (!sequence || sequence.length === 0) {
      return Set.empty();
    }
    return Set.empty().union(sequence);
  }

  static fromKeys(sequence) {
    return Set.from(Sequence(sequence).flip());
  }

  toString() {
    return this.__toString('Set {', '}');
  }

  // @pragma Access

  has(value) {
    return this._map ? this._map.has(value) : false;
  }

  get(value, notSetValue) {
    return this.has(value) ? value : notSetValue;
  }

  // @pragma Modification

  add(value) {
    if (value == null) {
      return this;
    }
    var newMap = this._map;
    if (!newMap) {
      newMap = Map.empty().__ensureOwner(this.__ownerID);
    }
    newMap = newMap.set(value, null);
    if (this.__ownerID) {
      this.length = newMap.length;
      this._map = newMap;
      return this;
    }
    return newMap === this._map ? this : makeSet(newMap);
  }

  delete(value) {
    if (value == null || this._map == null) {
      return this;
    }
    var newMap = this._map.delete(value);
    if (newMap.length === 0) {
      return this.clear();
    }
    if (this.__ownerID) {
      this.length = newMap.length;
      this._map = newMap;
      return this;
    }
    return newMap === this._map ? this : makeSet(newMap);
  }

  clear() {
    if (this.__ownerID) {
      this.length = 0;
      this._map = null;
      return this;
    }
    return Set.empty();
  }

  // @pragma Composition

  union(/*...seqs*/) {
    var seqs = arguments;
    if (seqs.length === 0) {
      return this;
    }
    return this.withMutations(set => {
      for (var ii = 0; ii < seqs.length; ii++) {
        var seq = seqs[ii];
        seq = seq.forEach ? seq : Sequence(seq);
        seq.forEach(value => set.add(value));
      }
    });
  }

  intersect(...seqs) {
    if (seqs.length === 0) {
      return this;
    }
    seqs = seqs.map(seq => Sequence(seq));
    var originalSet = this;
    return this.withMutations(set => {
      originalSet.forEach(value => {
        if (!seqs.every(seq => seq.contains(value))) {
          set.delete(value);
        }
      });
    });
  }

  subtract(...seqs) {
    if (seqs.length === 0) {
      return this;
    }
    seqs = seqs.map(seq => Sequence(seq));
    var originalSet = this;
    return this.withMutations(set => {
      originalSet.forEach(value => {
        if (seqs.some(seq => seq.contains(value))) {
          set.delete(value);
        }
      });
    });
  }

  isSubset(seq) {
    seq = Sequence(seq);
    return this.every(value => seq.contains(value));
  }

  isSuperset(seq) {
    var set = this;
    seq = Sequence(seq);
    return seq.every(value => set.contains(value));
  }

  __iterate(fn, reverse) {
    var collection = this;
    return this._map ? this._map.__iterate((_, k) => fn(k, k, collection), reverse) : 0;
  }

  __deepEquals(other) {
    return !(this._map || other._map) || this._map.equals(other._map);
  }

  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this;
    }
    var newMap = this._map && this._map.__ensureOwner(ownerID);
    if (!ownerID) {
      this.__ownerID = ownerID;
      this._map = newMap;
      return this;
    }
    return makeSet(newMap, ownerID);
  }
}

var SetPrototype = Set.prototype;
SetPrototype.contains = SetPrototype.has;
SetPrototype.withMutations = Map.prototype.withMutations;
SetPrototype.asMutable = Map.prototype.asMutable;
SetPrototype.asImmutable = Map.prototype.asImmutable;
SetPrototype.__toJS = IndexedSequence.prototype.__toJS;
SetPrototype.__toStringMapper = IndexedSequence.prototype.__toStringMapper;


function makeSet(map, ownerID) {
  var set = Object.create(SetPrototype);
  set.length = map ? map.length : 0;
  set._map = map;
  set.__ownerID = ownerID;
  return set;
}

var EMPTY_SET;
