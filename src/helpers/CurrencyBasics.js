module.exports = {
    nativeCurrency: () => {
        return 'CAD';
    },

    isFiatCurrency: (currency) => {
        return (currency === 'USD') || (currency === 'CAD') || (currency === 'EUR');
    }
};