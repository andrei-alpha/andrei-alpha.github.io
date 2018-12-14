$(function(){
	$("#input_table").css("display", "table")
});

$("#price_input").change(function() {
  formatNumber("#price_input")
});

$("#rent_input").change(function() {
  formatNumber("#rent_input")
});

$("#period_input").change(function() {
  var val = parseNumber($("#period_input").val());
  $("#period_input").val(numberWithCommas(val) + " years")
});

$("#downpayment_input").change(function() {
  formatPercentage("#downpayment_input")
});

$("#interest_input").change(function() {
  formatPercentage("#interest_input")
});

$("#tax_input").change(function() {
  formatPercentage("#tax_input")
});

$("#utilities_input").change(function() {
  formatPercentage("#utilities_input")
});

$("#rental_input").change(function() {
  formatPercentage("#rental_input")
});

$("#inputed_input").change(function() {
  formatPercentage("#inputed_input")
});

$("#calculate").click(function() {
	var partial_payment = 0.33;
	var months_in_year = 12;
	var zurich_income_tax_rate = 0.13;

	var total_price = parseNumber($("#price_input").val());
	var monthly_rent = parseNumber($("#rent_input").val());
	var loan_years = parseNumber($("#period_input").val());
	var downpayment = parseNumber($("#downpayment_input").val());
	var interest_rate = parseNumber($("#interest_input").val());
	var income_tax = parseNumber($("#tax_input").val());
	var utilities_rate = parseNumber($("#utilities_input").val());
	var rent_value_rate = parseNumber($("#rental_input").val());
	var rent_inputed_rate = parseNumber($("#inputed_input").val());

	remaining_price = total_price - (total_price * (downpayment / 100.0));

	amortized_price = (partial_payment - (downpayment / 100.0)) * total_price;
	monthly_loan = amortized_price / loan_years / months_in_year;
	monthly_utilities = total_price * (utilities_rate / 100.0) / months_in_year;
	monthly_tax = total_price * (rent_value_rate / 100.0) * (rent_inputed_rate / 100.0) * zurich_income_tax_rate / months_in_year;
	monthly_interest = remaining_price * (interest_rate / 100.0) / months_in_year;
	// Minimum salary for afordability is calculated based on the maximum interest rate from the last 50 years.
	worst_monthly_interest = remaining_price * (5 / 100.0) / months_in_year;

	result = monthly_rent - (monthly_utilities + monthly_tax + monthly_interest)
	monthly_salary = (monthly_loan + monthly_utilities + monthly_tax + worst_monthly_interest) * 3;
	downpayment = total_price * (downpayment / 100.0);
	monthly_cost = monthly_loan + monthly_utilities + monthly_interest;
	yearly_tax = monthly_tax * months_in_year;

	$("#output_table").css("display", "table");
	$("#result_output").css("font-weight", "bold");
	if (result > 0) {
		$("#result_output").css("color", "green");
		$("#result_output").html("Save " + outputNumber(result) + " per month.");
	} else {
		$("#result_output").css("color", "red");
		$("#result_output").html("Lose " + outputNumber(result) + " per month.");
	}
	$("#downpayment_output").html(outputNumber(downpayment));
	$("#salary_output").html(outputNumber(monthly_salary));
	$("#interest_output").html(outputNumber(monthly_interest));
	$("#amortization_output").html(outputNumber(parseInt(monthly_loan)));
	$("#maintenance_output").html(outputNumber(monthly_utilities));
	$("#montly_cost_output").html(outputNumber(monthly_cost));
	$("#tax_output").html(outputNumber(yearly_tax));
});

/*
period_input
downpayment_input
interest_input
tax_input
utilities_input
rental_input
inputed_input*/

const parseNumber = (text) => {
	return parseFloat(text.replace(/[^\d.-]/g, ''));
}

const formatNumber = (id) => {
	var val = parseNumber($(id).val());
  $(id).val(numberWithCommas(val) + " chf")
}

const formatPercentage = (id) => {
	var val = parseNumber($(id).val());
  $(id).val(numberWithCommas(val) + "%")
}

const outputNumber = (raw_number) => {
	return numberWithCommas(parseInt(raw_number)) + " chf"
}

const numberWithCommas = (x) => {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
