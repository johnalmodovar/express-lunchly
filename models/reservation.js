"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this._customerId = customerId;
    this._numGuests = numGuests;
    this.startAt = startAt;
    this._notes = notes;
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(val) {
    if (this._customerId) throw new Error("Cannot reassign customer ID.");
  }


  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (Number(val) < 1) throw new Error("Not a valid number of guests.");

    this._numGuests = val;
  }


  get notes() {
    return this._notes;
  }

  set notes(val) {
    if (!val) {
      this._notes = '';
    } else {
      this._notes = val;
    }
  }

  
  /** Grabs single reservation by id */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  start_at AS "startAt",
                  num_guests AS "numGuests",
                  notes
           FROM reservations
           WHERE id = $1`,
      [id],
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      const err = new Error(`No such Reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this._customerId, this.startAt, this._numGuests, this._notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET num_guests=$1,
                 notes=$2
             WHERE id = $3`, [
        this._numGuests,
        this._notes,
        this.id,
      ],
      );
    }
  }
}


module.exports = Reservation;
