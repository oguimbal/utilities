export function prettyNumber(number: number, fixed?: number) {
    if (typeof number !== 'number')
        number = (parseFloat(<any>number) || 0);
    if (typeof fixed !== 'number')
        number = 2;
    return number.toFixed(fixed).replace(/(\d)(?=(\d{3})+(\.|$))/g, '$1 ');
}

export interface IMoney {
    amt: number;
    cur: string;
}

const currencies = {
    'AED': { code: 'AED', name: 'United Arab Emirates Dirham', symbol: undefined },
    'AFN': { code: 'AFN', name: 'Afghan Afghani', symbol: undefined },
    'ALL': { code: 'ALL', name: 'Albanian Lek', symbol: undefined },
    'AMD': { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
    'ANG': { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: undefined },
    'AOA': { code: 'AOA', name: 'Angolan Kwanza', symbol: undefined },
    'ARS': { code: 'ARS', name: 'Argentine Peso', symbol: undefined },
    'AUD': { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$' },
    'AWG': { code: 'AWG', name: 'Aruban Florin', symbol: undefined },
    'AZN': { code: 'AZN', name: 'Azerbaijani Manat', symbol: undefined },
    'BAM': { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: undefined },
    'BBD': { code: 'BBD', name: 'Barbadian Dollar', symbol: undefined },
    'BDT': { code: 'BDT', name: 'Bangladeshi Taka', symbol: undefined },
    'BGN': { code: 'BGN', name: 'Bulgarian Lev', symbol: undefined },
    'BHD': { code: 'BHD', name: 'Bahraini Dinar', symbol: undefined },
    'BIF': { code: 'BIF', name: 'Burundian Franc', symbol: undefined },
    'BMD': { code: 'BMD', name: 'Bermudan Dollar', symbol: undefined },
    'BND': { code: 'BND', name: 'Brunei Dollar', symbol: undefined },
    'BOB': { code: 'BOB', name: 'Bolivian Boliviano', symbol: undefined },
    'BRL': { code: 'BRL', name: 'Brazilian Real', symbol: undefined },
    'BSD': { code: 'BSD', name: 'Bahamian Dollar', symbol: undefined },
    'BTC': { code: 'BTC', name: 'Bitcoin', symbol: undefined },
    'BTN': { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: undefined },
    'BWP': { code: 'BWP', name: 'Botswanan Pula', symbol: undefined },
    'BYR': { code: 'BYR', name: 'Belarusian Ruble', symbol: undefined },
    'BZD': { code: 'BZD', name: 'Belize Dollar', symbol: undefined },
    'CAD': { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
    'CDF': { code: 'CDF', name: 'Congolese Franc', symbol: undefined },
    'CHF': { code: 'CHF', name: 'Swiss Franc', symbol: undefined },
    'CLF': { code: 'CLF', name: 'Chilean Unit of Account (UF)', symbol: undefined },
    'CLP': { code: 'CLP', name: 'Chilean Peso', symbol: undefined },
    'CNY': { code: 'CNY', name: 'Chinese Yuan', symbol: '元' },
    'COP': { code: 'COP', name: 'Colombian Peso', symbol: undefined },
    'CRC': { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
    'CUC': { code: 'CUC', name: 'Cuban Convertible Peso', symbol: undefined },
    'CUP': { code: 'CUP', name: 'Cuban Peso', symbol: undefined },
    'CVE': { code: 'CVE', name: 'Cape Verdean Escudo', symbol: undefined },
    'CZK': { code: 'CZK', name: 'Czech Republic Koruna', symbol: 'Kč' },
    'DJF': { code: 'DJF', name: 'Djiboutian Franc', symbol: undefined },
    'DKK': { code: 'DKK', name: 'Danish Krone', symbol: undefined },
    'DOP': { code: 'DOP', name: 'Dominican Peso', symbol: undefined },
    'DZD': { code: 'DZD', name: 'Algerian Dinar', symbol: undefined },
    'EEK': { code: 'EEK', name: 'Estonian Kroon', symbol: undefined },
    'EGP': { code: 'EGP', name: 'Egyptian Pound', symbol: undefined },
    'ERN': { code: 'ERN', name: 'Eritrean Nakfa', symbol: undefined },
    'ETB': { code: 'ETB', name: 'Ethiopian Birr', symbol: undefined },
    'EUR': { code: 'EUR', name: 'Euro', symbol: '€' },
    'FJD': { code: 'FJD', name: 'Fijian Dollar', symbol: undefined },
    'FKP': { code: 'FKP', name: 'Falkland Islands Pound', symbol: undefined },
    'GBP': { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
    'GEL': { code: 'GEL', name: 'Georgian Lari', symbol: undefined },
    'GGP': { code: 'GGP', name: 'Guernsey Pound', symbol: undefined },
    'GHS': { code: 'GHS', name: 'Ghanaian Cedi', symbol: undefined },
    'GIP': { code: 'GIP', name: 'Gibraltar Pound', symbol: undefined },
    'GMD': { code: 'GMD', name: 'Gambian Dalasi', symbol: undefined },
    'GNF': { code: 'GNF', name: 'Guinean Franc', symbol: undefined },
    'GTQ': { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: undefined },
    'GYD': { code: 'GYD', name: 'Guyanaese Dollar', symbol: undefined },
    'HKD': { code: 'HKD', name: 'Hong Kong Dollar', symbol: undefined },
    'HNL': { code: 'HNL', name: 'Honduran Lempira', symbol: undefined },
    'HRK': { code: 'HRK', name: 'Croatian Kuna', symbol: undefined },
    'HTG': { code: 'HTG', name: 'Haitian Gourde', symbol: undefined },
    'HUF': { code: 'HUF', name: 'Hungarian Forint', symbol: undefined },
    'IDR': { code: 'IDR', name: 'Indonesian Rupiah', symbol: undefined },
    'ILS': { code: 'ILS', name: 'Israeli New Sheqel', symbol: undefined },
    'IMP': { code: 'IMP', name: 'Manx pound', symbol: undefined },
    'INR': { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    'IQD': { code: 'IQD', name: 'Iraqi Dinar', symbol: undefined },
    'IRR': { code: 'IRR', name: 'Iranian Rial', symbol: undefined },
    'ISK': { code: 'ISK', name: 'Icelandic Króna', symbol: undefined },
    'JEP': { code: 'JEP', name: 'Jersey Pound', symbol: undefined },
    'JMD': { code: 'JMD', name: 'Jamaican Dollar', symbol: undefined },
    'JOD': { code: 'JOD', name: 'Jordanian Dinar', symbol: undefined },
    'JPY': { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    'KES': { code: 'KES', name: 'Kenyan Shilling', symbol: undefined },
    'KGS': { code: 'KGS', name: 'Kyrgystani Som', symbol: undefined },
    'KHR': { code: 'KHR', name: 'Cambodian Riel', symbol: undefined },
    'KMF': { code: 'KMF', name: 'Comorian Franc', symbol: undefined },
    'KPW': { code: 'KPW', name: 'North Korean Won', symbol: undefined },
    'KRW': { code: 'KRW', name: 'South Korean Won', symbol: undefined },
    'KWD': { code: 'KWD', name: 'Kuwaiti Dinar', symbol: undefined },
    'KYD': { code: 'KYD', name: 'Cayman Islands Dollar', symbol: undefined },
    'KZT': { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
    'LAK': { code: 'LAK', name: 'Laotian Kip', symbol: '₭' },
    'LBP': { code: 'LBP', name: 'Lebanese Pound', symbol: undefined },
    'LKR': { code: 'LKR', name: 'Sri Lankan Rupee', symbol: undefined },
    'LRD': { code: 'LRD', name: 'Liberian Dollar', symbol: undefined },
    'LSL': { code: 'LSL', name: 'Lesotho Loti', symbol: undefined },
    'LTL': { code: 'LTL', name: 'Lithuanian Litas', symbol: undefined },
    'LVL': { code: 'LVL', name: 'Latvian Lats', symbol: undefined },
    'LYD': { code: 'LYD', name: 'Libyan Dinar', symbol: undefined },
    'MAD': { code: 'MAD', name: 'Moroccan Dirham', symbol: undefined },
    'MDL': { code: 'MDL', name: 'Moldovan Leu', symbol: undefined },
    'MGA': { code: 'MGA', name: 'Malagasy Ariary', symbol: undefined },
    'MKD': { code: 'MKD', name: 'Macedonian Denar', symbol: undefined },
    'MMK': { code: 'MMK', name: 'Myanma Kyat', symbol: undefined },
    'MNT': { code: 'MNT', name: 'Mongolian Tugrik', symbol: undefined },
    'MOP': { code: 'MOP', name: 'Macanese Pataca', symbol: undefined },
    'MRO': { code: 'MRO', name: 'Mauritanian Ouguiya', symbol: undefined },
    'MTL': { code: 'MTL', name: 'Maltese Lira', symbol: undefined },
    'MUR': { code: 'MUR', name: 'Mauritian Rupee', symbol: undefined },
    'MVR': { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: undefined },
    'MWK': { code: 'MWK', name: 'Malawian Kwacha', symbol: undefined },
    'MXN': { code: 'MXN', name: 'Mexican Peso', symbol: undefined },
    'MYR': { code: 'MYR', name: 'Malaysian Ringgit', symbol: undefined },
    'MZN': { code: 'MZN', name: 'Mozambican Metical', symbol: undefined },
    'NAD': { code: 'NAD', name: 'Namibian Dollar', symbol: undefined },
    'NGN': { code: 'NGN', name: 'Nigerian Naira', symbol: undefined },
    'NIO': { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: undefined },
    'NOK': { code: 'NOK', name: 'Norwegian Krone', symbol: undefined },
    'NPR': { code: 'NPR', name: 'Nepalese Rupee', symbol: undefined },
    'NZD': { code: 'NZD', name: 'New Zealand Dollar', symbol: undefined },
    'OMR': { code: 'OMR', name: 'Omani Rial', symbol: undefined },
    'PAB': { code: 'PAB', name: 'Panamanian Balboa', symbol: undefined },
    'PEN': { code: 'PEN', name: 'Peruvian Nuevo Sol', symbol: 'S/.' },
    'PGK': { code: 'PGK', name: 'Papua New Guinean Kina', symbol: undefined },
    'PHP': { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    'PKR': { code: 'PKR', name: 'Pakistani Rupee', symbol: undefined },
    'PLN': { code: 'PLN', name: 'Polish Zloty', symbol: undefined },
    'PYG': { code: 'PYG', name: 'Paraguayan Guarani', symbol: undefined },
    'QAR': { code: 'QAR', name: 'Qatari Rial', symbol: undefined },
    'RON': { code: 'RON', name: 'Romanian Leu', symbol: undefined },
    'RSD': { code: 'RSD', name: 'Serbian Dinar', symbol: undefined },
    'RUB': { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    'RWF': { code: 'RWF', name: 'Rwandan Franc', symbol: undefined },
    'SAR': { code: 'SAR', name: 'Saudi Riyal', symbol: undefined },
    'SBD': { code: 'SBD', name: 'Solomon Islands Dollar', symbol: undefined },
    'SCR': { code: 'SCR', name: 'Seychellois Rupee', symbol: undefined },
    'SDG': { code: 'SDG', name: 'Sudanese Pound', symbol: undefined },
    'SEK': { code: 'SEK', name: 'Swedish Krona', symbol: undefined },
    'SGD': { code: 'SGD', name: 'Singapore Dollar', symbol: undefined },
    'SHP': { code: 'SHP', name: 'Saint Helena Pound', symbol: undefined },
    'SLL': { code: 'SLL', name: 'Sierra Leonean Leone', symbol: undefined },
    'SOS': { code: 'SOS', name: 'Somali Shilling', symbol: undefined },
    'SRD': { code: 'SRD', name: 'Surinamese Dollar', symbol: undefined },
    'STD': { code: 'STD', name: 'São Tomé and Príncipe Dobra', symbol: undefined },
    'SVC': { code: 'SVC', name: 'Salvadoran Colón', symbol: undefined },
    'SYP': { code: 'SYP', name: 'Syrian Pound', symbol: undefined },
    'SZL': { code: 'SZL', name: 'Swazi Lilangeni', symbol: undefined },
    'THB': { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    'TJS': { code: 'TJS', name: 'Tajikistani Somoni', symbol: undefined },
    'TMT': { code: 'TMT', name: 'Turkmenistani Manat', symbol: undefined },
    'TND': { code: 'TND', name: 'Tunisian Dinar', symbol: undefined },
    'TOP': { code: 'TOP', name: 'Tongan Paʻanga', symbol: undefined },
    'TRY': { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    'TTD': { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: undefined },
    'TWD': { code: 'TWD', name: 'New Taiwan Dollar', symbol: undefined },
    'TZS': { code: 'TZS', name: 'Tanzanian Shilling', symbol: undefined },
    'UAH': { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
    'UGX': { code: 'UGX', name: 'Ugandan Shilling', symbol: undefined },
    'USD': { code: 'USD', name: 'United States Dollar', symbol: '$' },
    'UYU': { code: 'UYU', name: 'Uruguayan Peso', symbol: undefined },
    'UZS': { code: 'UZS', name: 'Uzbekistan Som', symbol: undefined },
    'VEF': { code: 'VEF', name: 'Venezuelan Bolívar Fuerte', symbol: undefined },
    'VND': { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    'VUV': { code: 'VUV', name: 'Vanuatu Vatu', symbol: undefined },
    'WST': { code: 'WST', name: 'Samoan Tala', symbol: undefined },
    'XAF': { code: 'XAF', name: 'CFA Franc BEAC', symbol: undefined },
    'XAG': { code: 'XAG', name: 'Silver (troy ounce)', symbol: undefined },
    'XAU': { code: 'XAU', name: 'Gold (troy ounce)', symbol: undefined },
    'XCD': { code: 'XCD', name: 'East Caribbean Dollar', symbol: undefined },
    'XDR': { code: 'XDR', name: 'Special Drawing Rights', symbol: undefined },
    'XOF': { code: 'XOF', name: 'CFA Franc BCEAO', symbol: undefined },
    'XPD': { code: 'XPD', name: 'Palladium Ounce', symbol: undefined },
    'XPF': { code: 'XPF', name: 'CFP Franc', symbol: undefined },
    'XPT': { code: 'XPT', name: 'Platinum Ounce', symbol: undefined },
    'YER': { code: 'YER', name: 'Yemeni Rial', symbol: undefined },
    'ZAR': { code: 'ZAR', name: 'South African Rand', symbol: undefined },
    'ZMK': { code: 'ZMK', name: 'Zambian Kwacha (pre-2013)', symbol: undefined },
    'ZMW': { code: 'ZMW', name: 'Zambian Kwacha', symbol: undefined },
    'ZWL': { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: undefined }
};
export function prettyMoney(amount: IMoney | number, cur?: string) {
    let amt = 0;
    if (typeof amount === 'number')
        amt = <number>amount;
    else {
        const x = <IMoney>amount;
        amt = x.amt;
        cur = x.cur;
    }

    if (!amt)
        return '-';
    
    const amtStr = prettyNumber(amt);
    const csymbol = prettyCurrency(cur);

    return csymbol ? amtStr + ' ' + csymbol : amtStr;
}

export function prettyCurrency(currency: string): string {
    if (!currency)
        return null;
    if (!(currency in currencies))
        return currency;
    const c = currencies[currency];
    return c.symbol || c.code;
}