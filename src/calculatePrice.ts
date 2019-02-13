export const ethPrice = (input_reserve: any, output_reserve: any, input_amount: any) => {
  try {
    const input_amount_with_fee = input_amount * 10**18 * 997;

    const numerator = input_amount_with_fee * output_reserve;
    const denominator = (input_reserve *1000) + input_amount_with_fee;



    return (numerator / denominator) / 10**18;
  } catch (err) {
    throw err
  }
}

export const tokenPrice = (input_reserve: any, output_reserve: any, output_amount: any) => {
  try{
    const output_amount_int = output_amount * 10**18;

    const numerator = input_reserve * output_amount_int * 1000;
    const denominator = (output_reserve - output_amount_int) * 997;

    return (numerator / denominator + 1) / 10**18;
  } catch (err) {
    throw err
  }
}
