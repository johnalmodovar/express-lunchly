"use strict";

/** Routes for Lunchly */

const express = require("express");

const { BadRequestError } = require("./expressError");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** addReservationCounts: adds a reservationCount key to each Customer object.  */

async function addReservationCounts(customers) {
  const reservationPromises = customers.map(c => c.getReservations());
  const reservations = await Promise.all(reservationPromises);

  customers.map((c, idx) => {
    c.reservationCount = reservations[idx].length;
  });
}

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  let customers;

  if (req.query.search) {
    customers = await Customer.search(req.query.search);
  } else {
    customers = await Customer.all();
  }



  return res.render("customer_list.html", { customers });
});

/** Top Ten: shows list of top ten customers */

router.get("/top-ten/", async function (req, res) {
  const customers = await Customer.getBestCustomers();
  await addReservationCounts(customers);

  return res.render("customer_best_list.html", { customers });
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle deleting a customer. */

router.post("/:id/delete/", async function (req, res) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  for (const reservation of reservations) {
    reservation.remove();
  }

  await customer.remove();

  return res.redirect("/");
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

/** Get edit reservation form */

router.get("/:id/edit-reservation/", async function (req, res) {
  const reservation = await Reservation.get(req.params.id);
  const customer = await Customer.get(reservation.customerId);

  return res.render("reservation_edit.html", { reservation, customer });
});

/** Handle edit a reservation */

router.post("/:id/edit-reservation/", async function (req, res) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const reservation = await Reservation.get(req.params.id);
  reservation.numGuests = req.body.numGuests;
  reservation.notes = req.body.notes;
  await reservation.save();

  return res.redirect(`/${reservation.customerId}/`);
});

module.exports = router;


router.post("/:id/delete-reservation", async function (req, res) {
  const reservation = await Reservation.get(req.params.id);
  const customerId = reservation.customerId;
  await reservation.remove();

  return res.redirect(`/${customerId}/`);
});
