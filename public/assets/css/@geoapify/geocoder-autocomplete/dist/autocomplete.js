import countiesData from "@geoapify/geocoder-autocomplete/dist/countries.json";
export class GeocoderAutocomplete {
    container;
    apiKey;
    inputElement;
    inputClearButton;
    autocompleteItemsElement = null;
    /* Focused item in the autocomplete list. This variable is used to navigate with buttons */
    focusedItemIndex;
    /* Current autocomplete items data (GeoJSON.Feature) */
    currentItems;
    /* Active request promise reject function. To be able to cancel the promise when a new request comes */
    currentPromiseReject;
    /* Active place details request promise reject function */
    currentPlaceDetailsPromiseReject;
    /* We set timeout before sending a request to avoid unnecessary calls */
    currentTimeout;
    changeCallbacks = [];
    suggestionsChangeCallbacks = [];
    inputCallbacks = [];
    openCallbacks = [];
    closeCallbacks = [];
    preprocessHook;
    postprocessHook;
    suggestionsFilter;
    geocoderUrl = "https://api.geoapify.com/v1/geocode/autocomplete";
    placeDetailsUrl = "https://api.geoapify.com/v2/place-details";
    options = {
        limit: 5,
        debounceDelay: 100
    };
    BY_COUNTRYCODE = 'countrycode';
    BY_RECT = 'rect';
    BY_CIRCLE = 'circle';
    BY_PROXIMITY = 'proximity';
    BY_PLACE = 'place';
    constructor(container, apiKey, options) {
        this.container = container;
        this.apiKey = apiKey;
        this.options = options ? { ...this.options, ...options } : this.options;
        this.options.filter = this.options.filter || {};
        this.options.bias = this.options.bias || {};
        if (this.options.countryCodes) {
            this.addFilterByCountry(this.options.countryCodes);
        }
        if (this.options.position) {
            this.addBiasByProximity(this.options.position);
        }
        // create input element
        this.inputElement = document.createElement("input");
        this.inputElement.classList.add("geoapify-autocomplete-input");
        this.inputElement.setAttribute("type", "text");
        this.inputElement.setAttribute("placeholder", this.options.placeholder || "Enter an address here");
        this.container.appendChild(this.inputElement);
        // add clear button to input element
        this.inputClearButton = document.createElement("div");
        this.inputClearButton.classList.add("geoapify-close-button");
        this.addIcon(this.inputClearButton, 'close');
        this.inputClearButton.addEventListener("click", this.clearFieldAndNotify.bind(this), false);
        this.container.appendChild(this.inputClearButton);
        this.inputElement.addEventListener('input', this.onUserInput.bind(this), false);
        this.inputElement.addEventListener('keydown', this.onUserKeyPress.bind(this), false);
        document.addEventListener("click", (event) => {
            if (event.target !== this.inputElement) {
                this.closeDropDownList();
            }
            else if (!this.autocompleteItemsElement) {
                // open dropdown list again
                this.openDropdownAgain();
            }
        });
    }
    setType(type) {
        this.options.type = type;
    }
    setLang(lang) {
        this.options.lang = lang;
    }
    setCountryCodes(codes) {
        console.warn("WARNING! Obsolete function called. Function setCountryCodes() has been deprecated, please use the new addFilterByCountry() function instead!");
        this.options.countryCodes = codes;
    }
    setPosition(position) {
        console.warn("WARNING! Obsolete function called. Function setPosition() has been deprecated, please use the new addBiasByProximity() function instead!");
        this.options.position = position;
    }
    setLimit(limit) {
        this.options.limit = limit;
    }
    setValue(value) {
        if (!value) {
            this.inputClearButton.classList.remove("visible");
        }
        else {
            this.inputClearButton.classList.add("visible");
        }
        this.inputElement.value = value;
    }
    getValue() {
        return this.inputElement.value;
    }
    addFilterByCountry(codes) {
        this.options.filter[this.BY_COUNTRYCODE] = codes;
    }
    addFilterByCircle(filterByCircle) {
        this.options.filter[this.BY_CIRCLE] = filterByCircle;
    }
    addFilterByRect(filterByRect) {
        this.options.filter[this.BY_RECT] = filterByRect;
    }
    addFilterByPlace(filterByPlace) {
        this.options.filter[this.BY_PLACE] = filterByPlace;
    }
    clearFilters() {
        this.options.filter = {};
    }
    addBiasByCountry(codes) {
        this.options.bias[this.BY_COUNTRYCODE] = codes;
    }
    addBiasByCircle(biasByCircle) {
        this.options.bias[this.BY_CIRCLE] = biasByCircle;
    }
    addBiasByRect(biasByRect) {
        this.options.bias[this.BY_RECT] = biasByRect;
    }
    addBiasByProximity(biasByProximity) {
        this.options.bias[this.BY_PROXIMITY] = biasByProximity;
    }
    clearBias() {
        this.options.bias = {};
    }
    on(operation, callback) {
        if (operation === 'select' && this.changeCallbacks.indexOf(callback) < 0) {
            this.changeCallbacks.push(callback);
        }
        if (operation === 'suggestions' && this.suggestionsChangeCallbacks.indexOf(callback) < 0) {
            this.suggestionsChangeCallbacks.push(callback);
        }
        if (operation === 'input' && this.inputCallbacks.indexOf(callback) < 0) {
            this.inputCallbacks.push(callback);
        }
        if (operation === 'close' && this.closeCallbacks.indexOf(callback) < 0) {
            this.closeCallbacks.push(callback);
        }
        if (operation === 'open' && this.openCallbacks.indexOf(callback) < 0) {
            this.openCallbacks.push(callback);
        }
    }
    off(operation, callback) {
        if (operation === 'select' && this.changeCallbacks.indexOf(callback) >= 0) {
            this.changeCallbacks.splice(this.changeCallbacks.indexOf(callback), 1);
        }
        else if (operation === 'select' && !callback) {
            this.changeCallbacks = [];
        }
        if (operation === 'suggestions' && this.suggestionsChangeCallbacks.indexOf(callback) >= 0) {
            this.suggestionsChangeCallbacks.splice(this.suggestionsChangeCallbacks.indexOf(callback), 1);
        }
        else if (operation === 'suggestions' && !callback) {
            this.suggestionsChangeCallbacks = [];
        }
        if (operation === 'input' && this.inputCallbacks.indexOf(callback) >= 0) {
            this.inputCallbacks.splice(this.inputCallbacks.indexOf(callback), 1);
        }
        else if (operation === 'input' && !callback) {
            this.inputCallbacks = [];
        }
        if (operation === 'close' && this.closeCallbacks.indexOf(callback) >= 0) {
            this.closeCallbacks.splice(this.closeCallbacks.indexOf(callback), 1);
        }
        else if (operation === 'close' && !callback) {
            this.closeCallbacks = [];
        }
        if (operation === 'open' && this.openCallbacks.indexOf(callback) >= 0) {
            this.openCallbacks.splice(this.openCallbacks.indexOf(callback), 1);
        }
        else if (operation === 'open' && !callback) {
            this.openCallbacks = [];
        }
    }
    once(operation, callback) {
        this.on(operation, callback);
        const current = this;
        const currentListener = () => {
            current.off(operation, callback);
            current.off(operation, currentListener);
        };
        this.on(operation, currentListener);
    }
    setSuggestionsFilter(suggestionsFilterFunc) {
        this.suggestionsFilter = suggestionsFilterFunc;
    }
    setPreprocessHook(preprocessHookFunc) {
        this.preprocessHook = preprocessHookFunc;
    }
    setPostprocessHook(postprocessHookFunc) {
        this.postprocessHook = postprocessHookFunc;
    }
    isOpen() {
        return !!this.autocompleteItemsElement;
    }
    close() {
        this.closeDropDownList();
    }
    open() {
        if (!this.isOpen()) {
            this.openDropdownAgain();
        }
    }
    /* Execute a function when someone writes in the text field: */
    onUserInput(event) {
        let currentValue = this.inputElement.value;
        let userEnteredValue = this.inputElement.value;
        this.inputCallbacks.forEach(callback => callback(currentValue));
        /* Close any already open dropdown list */
        this.closeDropDownList();
        this.focusedItemIndex = -1;
        // Cancel previous request
        if (this.currentPromiseReject) {
            this.currentPromiseReject({
                canceled: true
            });
            this.currentPromiseReject = null;
        }
        // Cancel previous timeout
        if (this.currentTimeout) {
            window.clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        if (!currentValue) {
            this.inputClearButton.classList.remove("visible");
            return false;
        }
        // Show clearButton when there is a text
        this.inputClearButton.classList.add("visible");
        this.currentTimeout = window.setTimeout(() => {
            /* Create a new promise and send geocoding request */
            const promise = new Promise((resolve, reject) => {
                this.currentPromiseReject = reject;
                if (this.preprocessHook && typeof this.preprocessHook === 'function') {
                    currentValue = this.preprocessHook(currentValue);
                }
                let url = this.generateUrl(currentValue);
                fetch(url)
                    .then((response) => {
                    if (response.ok) {
                        response.json().then(data => resolve(data));
                    }
                    else {
                        response.json().then(data => reject(data));
                    }
                });
            });
            promise.then((data) => {
                if (data.features && data.features.length &&
                    data?.query?.parsed &&
                    (this.options.allowNonVerifiedHouseNumber || this.options.allowNonVerifiedStreet)) {
                    this.extendByNonVerifiedValues(data.features, data?.query?.parsed);
                }
                this.currentItems = data.features;
                if (this.currentItems && this.currentItems.length && this.suggestionsFilter && typeof this.suggestionsFilter === 'function') {
                    this.currentItems = this.suggestionsFilter(this.currentItems);
                }
                this.notifySuggestions(this.currentItems);
                if (!this.currentItems.length) {
                    return;
                }
                /*create a DIV element that will contain the items (values):*/
                this.autocompleteItemsElement = document.createElement("div");
                this.autocompleteItemsElement.setAttribute("class", "geoapify-autocomplete-items");
                this.notifyOpened();
                /* Append the DIV element as a child of the autocomplete container:*/
                this.container.appendChild(this.autocompleteItemsElement);
                /* For each item in the results */
                this.currentItems.forEach((feature, index) => {
                    /* Create a DIV element for each element: */
                    const itemElement = document.createElement("div");
                    itemElement.classList.add('geoapify-autocomplete-item');
                    if (!this.options.skipIcons) {
                        const iconElement = document.createElement("span");
                        iconElement.classList.add('icon');
                        this.addFeatureIcon(iconElement, feature.properties.result_type, feature.properties.country_code);
                        itemElement.appendChild(iconElement);
                    }
                    const textElement = document.createElement("span");
                    textElement.classList.add('address');
                    if (this.postprocessHook && typeof this.postprocessHook === 'function') {
                        const value = this.postprocessHook(feature);
                        textElement.innerHTML = this.getStyledAddressSingleValue(value, userEnteredValue);
                    }
                    else {
                        textElement.innerHTML = this.getStyledAddress(feature.properties, userEnteredValue);
                    }
                    itemElement.appendChild(textElement);
                    itemElement.addEventListener("click", (e) => {
                        event.stopPropagation();
                        this.setValueAndNotify(this.currentItems[index]);
                    });
                    this.autocompleteItemsElement.appendChild(itemElement);
                });
            }, (err) => {
                if (!err.canceled) {
                    console.log(err);
                }
            });
        }, this.options.debounceDelay);
    }
    addHouseNumberToFormatted(featureProperties, street, housenumber) {
        const houseNumberAndStreetFormatsPerCountry = {
            "{{{road}}} {{{house_number}}}": ["af", "ai", "al", "ao", "ar", "at", "aw", "ax", "ba", "be", "bg", "bi", "bo", "bq", "br", "bs", "bt", "bv", "bw", "cf", "ch", "cl", "cm", "co", "cr", "cu", "cv", "cw", "cy", "cz", "de", "dk", "do", "ec", "ee", "eh", "er", "et", "fi", "fo", "gd", "ge", "gl", "gq", "gr", "gt", "gw", "hn", "hr", "ht", "hu", "id", "il", "ir", "is", "jo", "ki", "km", "kp", "kw", "lc", "li", "lr", "lt", "lv", "ly", "me", "mk", "ml", "mn", "mo", "mx", "ni", "nl", "no", "np", "pa", "pe", "pl", "ps", "pt", "pw", "py", "qa", "ro", "rs", "ru", "sb", "sd", "se", "si", "sj", "sk", "so", "sr", "ss", "st", "sv", "sx", "sz", "td", "tj", "tl", "tr", "um", "uz", "uy", "vc", "ve", "vu", "ws"],
            "{{{house_number}}} {{{road}}}": ["ad", "ae", "ag", "am", "as", "au", "az", "bb", "bd", "bf", "bh", "bl", "bm", "bz", "ca", "cc", "ci", "ck", "cn", "cx", "dj", "dm", "dz", "eg", "fj", "fk", "fm", "fr", "ga", "gb", "gf", "gg", "gh", "gi", "gm", "gn", "gp", "gs", "gu", "gy", "hk", "hm", "ie", "im", "io", "iq", "je", "jm", "jp", "ke", "kh", "kn", "kr", "ky", "lb", "lk", "ls", "lu", "ma", "mc", "mf", "mh", "mg", "mm", "mp", "ms", "mt", "mq", "mv", "mw", "my", "na", "nc", "ne", "nf", "ng", "nr", "nu", "nz", "om", "pf", "pg", "ph", "pk", "pm", "pr", "re", "rw", "sa", "sc", "sg", "sh", "sl", "sn", "tc", "tf", "th", "tk", "tn", "to", "tt", "tv", "tw", "tz", "ug", "us", "vg", "vi", "wf", "yt", "za", "zm", "zw"],
            "{{{road}}}, {{{house_number}}}": ["by", "es", "it", "kg", "kz", "md", "mz", "sm", "sy", "ua", "va"],
            "{{{house_number}}}, {{{road}}}": ["bj", "bn", "cd", "cg", "in", "la", "mr", "mu", "tg", "tm", "vn", "ye"]
        };
        const format = Object.keys(houseNumberAndStreetFormatsPerCountry).find(key => houseNumberAndStreetFormatsPerCountry[key].indexOf(featureProperties.country_code) >= 0) || "{{{road}}} {{{house_number}}}";
        if (street) {
            // add street and housenumber
            featureProperties.street = street.replace(/(^\w|\s\w|[-]\w)/g, m => m.toUpperCase());
            featureProperties.housenumber = housenumber;
            const addressPart = format.replace("{{{road}}}", featureProperties.street).replace("{{{house_number}}}", housenumber);
            featureProperties.address_line1 = addressPart;
            featureProperties.address_line2 = featureProperties.formatted;
            featureProperties.formatted = addressPart + ", " + featureProperties.formatted;
        }
        else {
            // add house number only
            featureProperties.housenumber = housenumber;
            const addressPart = format.replace("{{{road}}}", featureProperties.street).replace("{{{house_number}}}", housenumber);
            featureProperties.address_line1 = featureProperties.address_line1.replace(featureProperties.street, addressPart);
            ;
            featureProperties.formatted = featureProperties.formatted.replace(featureProperties.street, addressPart);
        }
    }
    extendByNonVerifiedValues(features, parsedAddress) {
        features.forEach((feature) => {
            if (parsedAddress.housenumber &&
                this.options.allowNonVerifiedHouseNumber && feature.properties.rank.match_type === "match_by_street") {
                // add housenumber
                this.addHouseNumberToFormatted(feature.properties, null, parsedAddress.housenumber);
                feature.properties.nonVerifiedParts = ["housenumber"];
            }
            else if (parsedAddress.street && parsedAddress.housenumber &&
                this.options.allowNonVerifiedStreet &&
                (feature.properties.rank.match_type === "match_by_city_or_disrict" || feature.properties.rank.match_type === "match_by_postcode")) {
                // add housenumber and street
                this.addHouseNumberToFormatted(feature.properties, parsedAddress.street, parsedAddress.housenumber);
                feature.properties.nonVerifiedParts = ["housenumber", "street"];
            }
            else if (parsedAddress.street &&
                this.options.allowNonVerifiedStreet &&
                (feature.properties.rank.match_type === "match_by_city_or_disrict" || feature.properties.rank.match_type === "match_by_postcode")) {
                // add street
                feature.properties.street = parsedAddress.street.replace(/(^\w|\s\w|[-]\w)/g, (m) => m.toUpperCase());
                feature.properties.address_line1 = feature.properties.street;
                feature.properties.address_line2 = feature.properties.formatted;
                feature.properties.formatted = feature.properties.street + ", " + feature.properties.formatted;
                feature.properties.nonVerifiedParts = ["street"];
            }
        });
    }
    getStyledAddressSingleValue(value, currentValue) {
        let displayValue = value;
        const valueIndex = (displayValue || '').toLowerCase().indexOf(currentValue.toLowerCase());
        if (valueIndex >= 0) {
            displayValue = displayValue.substring(0, valueIndex) +
                `<strong>${displayValue.substring(valueIndex, valueIndex + currentValue.length)}</strong>` +
                displayValue.substring(valueIndex + currentValue.length);
        }
        return `<span class="main-part">${displayValue}</span>`;
    }
    getStyledAddress(featureProperties, currentValue) {
        let mainPart;
        let secondaryPart;
        const parts = featureProperties.formatted.split(',').map((part) => part.trim());
        if (featureProperties.name) {
            mainPart = parts[0];
            secondaryPart = parts.slice(1).join(', ');
        }
        else {
            const mainElements = Math.min(2, Math.max(parts.length - 2, 1));
            mainPart = parts.slice(0, mainElements).join(', ');
            secondaryPart = parts.slice(mainElements).join(', ');
        }
        if (featureProperties.nonVerifiedParts && featureProperties.nonVerifiedParts.length) {
            featureProperties.nonVerifiedParts.forEach((part) => {
                mainPart = mainPart.replace(featureProperties[part], `<span class="non-verified">${featureProperties[part]}</span>`);
            });
        }
        else {
            const valueIndex = mainPart.toLowerCase().indexOf(currentValue.toLowerCase());
            if (valueIndex >= 0) {
                mainPart = mainPart.substring(0, valueIndex) +
                    `<strong>${mainPart.substring(valueIndex, valueIndex + currentValue.length)}</strong>` +
                    mainPart.substring(valueIndex + currentValue.length);
            }
        }
        return `<span class="main-part">${mainPart}</span><span class="secondary-part">${secondaryPart}</span>`;
    }
    onUserKeyPress(event) {
        if (this.autocompleteItemsElement) {
            const itemElements = this.autocompleteItemsElement.getElementsByTagName("div");
            if (event.code === 'ArrowDown') {
                event.preventDefault();
                /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
                this.focusedItemIndex++;
                if (this.focusedItemIndex >= itemElements.length)
                    this.focusedItemIndex = 0;
                /*and and make the current item more visible:*/
                this.setActive(itemElements, this.focusedItemIndex);
            }
            else if (event.code === 'ArrowUp') {
                event.preventDefault();
                /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
                this.focusedItemIndex--;
                if (this.focusedItemIndex < 0)
                    this.focusedItemIndex = (itemElements.length - 1);
                /*and and make the current item more visible:*/
                this.setActive(itemElements, this.focusedItemIndex);
            }
            else if (event.code === "Enter") {
                /* If the ENTER key is pressed and value as selected, close the list*/
                event.preventDefault();
                if (this.focusedItemIndex > -1) {
                    if (this.options.skipSelectionOnArrowKey) {
                        // select the location if it wasn't selected by navigation
                        this.setValueAndNotify(this.currentItems[this.focusedItemIndex]);
                    }
                    else {
                        this.closeDropDownList();
                    }
                }
            }
            else if (event.code === "Escape") {
                /* If the ESC key is presses, close the list */
                this.closeDropDownList();
            }
        }
        else {
            if (event.code == 'ArrowDown') {
                /* Open dropdown list again */
                this.openDropdownAgain();
            }
        }
    }
    setActive(items, index) {
        if (!items || !items.length)
            return false;
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove("active");
        }
        /* Add class "autocomplete-active" to the active element*/
        items[index].classList.add("active");
        if (!this.options.skipSelectionOnArrowKey) {
            // Change input value and notify
            if (this.postprocessHook && typeof this.postprocessHook === 'function') {
                this.inputElement.value = this.postprocessHook(this.currentItems[index]);
            }
            else {
                this.inputElement.value = this.currentItems[index].properties.formatted;
            }
            this.notifyValueSelected(this.currentItems[index]);
        }
    }
    setValueAndNotify(feature) {
        if (this.postprocessHook && typeof this.postprocessHook === 'function') {
            this.inputElement.value = this.postprocessHook(feature);
        }
        else {
            this.inputElement.value = feature.properties.formatted;
        }
        this.notifyValueSelected(feature);
        /* Close the list of autocompleted values: */
        this.closeDropDownList();
    }
    clearFieldAndNotify(event) {
        event.stopPropagation();
        this.inputElement.value = '';
        this.inputClearButton.classList.remove("visible");
        // Cancel previous request
        if (this.currentPromiseReject) {
            this.currentPromiseReject({
                canceled: true
            });
            this.currentPromiseReject = null;
        }
        // Cancel previous timeout
        if (this.currentTimeout) {
            window.clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        this.closeDropDownList();
        // notify here
        this.notifyValueSelected(null);
    }
    closeDropDownList() {
        if (this.autocompleteItemsElement) {
            this.container.removeChild(this.autocompleteItemsElement);
            this.autocompleteItemsElement = null;
            this.notifyClosed();
        }
    }
    addIcon(element, icon) {
        //FortAwesome icons 5. Licence - https://fontawesome.com/license/free
        const icons = {
            "close": {
                path: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
                viewbox: "0 0 24 24"
            },
            "map-marker": {
                path: "M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z",
                viewbox: "0 0 384 512"
            },
            "road": {
                path: "M573.19 402.67l-139.79-320C428.43 71.29 417.6 64 405.68 64h-97.59l2.45 23.16c.5 4.72-3.21 8.84-7.96 8.84h-29.16c-4.75 0-8.46-4.12-7.96-8.84L267.91 64h-97.59c-11.93 0-22.76 7.29-27.73 18.67L2.8 402.67C-6.45 423.86 8.31 448 30.54 448h196.84l10.31-97.68c.86-8.14 7.72-14.32 15.91-14.32h68.8c8.19 0 15.05 6.18 15.91 14.32L348.62 448h196.84c22.23 0 36.99-24.14 27.73-45.33zM260.4 135.16a8 8 0 0 1 7.96-7.16h39.29c4.09 0 7.53 3.09 7.96 7.16l4.6 43.58c.75 7.09-4.81 13.26-11.93 13.26h-40.54c-7.13 0-12.68-6.17-11.93-13.26l4.59-43.58zM315.64 304h-55.29c-9.5 0-16.91-8.23-15.91-17.68l5.07-48c.86-8.14 7.72-14.32 15.91-14.32h45.15c8.19 0 15.05 6.18 15.91 14.32l5.07 48c1 9.45-6.41 17.68-15.91 17.68z",
                viewbox: "0 0 576 512"
            },
            "city": {
                path: "M616 192H480V24c0-13.26-10.74-24-24-24H312c-13.26 0-24 10.74-24 24v72h-64V16c0-8.84-7.16-16-16-16h-16c-8.84 0-16 7.16-16 16v80h-64V16c0-8.84-7.16-16-16-16H80c-8.84 0-16 7.16-16 16v80H24c-13.26 0-24 10.74-24 24v360c0 17.67 14.33 32 32 32h576c17.67 0 32-14.33 32-32V216c0-13.26-10.75-24-24-24zM128 404c0 6.63-5.37 12-12 12H76c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12H76c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12H76c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm128 192c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm160 96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12V76c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm160 288c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40zm0-96c0 6.63-5.37 12-12 12h-40c-6.63 0-12-5.37-12-12v-40c0-6.63 5.37-12 12-12h40c6.63 0 12 5.37 12 12v40z",
                viewbox: "0 0 640 512"
            }
        };
        var svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svgElement.setAttribute('viewBox', icons[icon].viewbox);
        svgElement.setAttribute('height', "24");
        var iconElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        iconElement.setAttribute("d", icons[icon].path);
        iconElement.setAttribute('fill', 'currentColor');
        svgElement.appendChild(iconElement);
        element.appendChild(svgElement);
    }
    addFeatureIcon(element, type, countryCode) {
        const iconMap = {
            'unknown': 'map-marker',
            'amenity': 'map-marker',
            'building': 'map-marker',
            'street': 'road',
            'suburb': 'city',
            'district': 'city',
            'postcode': 'city',
            'city': 'city',
            'county': 'city',
            'state': 'city'
        };
        const countryData = countiesData.find(county => countryCode && county.code.toLowerCase() === countryCode.toLowerCase());
        if ((type === 'country') && countryData) {
            element.classList.add("emoji");
            ;
            const emojiElement = document.createElement('span');
            emojiElement.innerText = countryData.emoji;
            element.appendChild(emojiElement);
        }
        else if (iconMap[type]) {
            this.addIcon(element, iconMap[type]);
        }
        else {
            this.addIcon(element, 'map-marker');
        }
    }
    notifyValueSelected(feature) {
        // Cancel previous place details request
        if (this.currentPlaceDetailsPromiseReject) {
            this.currentPlaceDetailsPromiseReject({
                canceled: true
            });
            this.currentPlaceDetailsPromiseReject = null;
        }
        if (this.options.skipDetails || !feature || feature.properties.nonVerifiedParts?.length) {
            this.changeCallbacks.forEach(callback => callback(feature));
        }
        else {
            const promise = new Promise((resolve, reject) => {
                this.currentPlaceDetailsPromiseReject = reject;
                let url = this.generatePlacesUrlUrl(feature.properties.place_id);
                fetch(url)
                    .then((response) => {
                    if (response.ok) {
                        response.json().then(data => resolve(data));
                    }
                    else {
                        response.json().then(data => reject(data));
                    }
                });
            });
            promise.then((data) => {
                if (!data.features.length) {
                    this.changeCallbacks.forEach(callback => callback(feature));
                    return;
                }
                const placeDetails = data.features[0];
                this.changeCallbacks.forEach(callback => callback(placeDetails));
                this.currentPlaceDetailsPromiseReject = null;
            }, (err) => {
                if (!err.canceled) {
                    console.log(err);
                }
            });
        }
    }
    notifySuggestions(features) {
        this.suggestionsChangeCallbacks.forEach(callback => callback(features));
    }
    notifyOpened() {
        this.openCallbacks.forEach(callback => callback(true));
    }
    notifyClosed() {
        this.closeCallbacks.forEach(callback => callback(false));
    }
    openDropdownAgain() {
        const event = document.createEvent('Event');
        event.initEvent('input', true, true);
        this.inputElement.dispatchEvent(event);
    }
    generatePlacesUrlUrl(placeId) {
        let url = `${this.placeDetailsUrl}?id=${placeId}&apiKey=${this.apiKey}`;
        if (this.options.lang) {
            url += `&lang=${this.options.lang}`;
        }
        return url;
    }
    generateUrl(value) {
        let url = `${this.geocoderUrl}?text=${encodeURIComponent(value)}&apiKey=${this.apiKey}`;
        // Add type of the location if set. Learn more about possible parameters on https://apidocs.geoapify.com/docs/geocoding/api/api
        if (this.options.type) {
            url += `&type=${this.options.type}`;
        }
        if (this.options.limit) {
            url += `&limit=${this.options.limit}`;
        }
        if (this.options.lang) {
            url += `&lang=${this.options.lang}`;
        }
        const filters = [];
        const filterByCountryCodes = this.options.filter[this.BY_COUNTRYCODE];
        const filterByCircle = this.options.filter[this.BY_CIRCLE];
        const filterByRect = this.options.filter[this.BY_RECT];
        const filterByPlace = this.options.filter[this.BY_PLACE];
        if (filterByCountryCodes && filterByCountryCodes.length) {
            filters.push(`countrycode:${filterByCountryCodes.join(',').toLowerCase()}`);
        }
        if (filterByCircle && this.isLatitude(filterByCircle.lat) && this.isLongitude(filterByCircle.lon) && filterByCircle.radiusMeters > 0) {
            filters.push(`circle:${filterByCircle.lon},${filterByCircle.lat},${filterByCircle.radiusMeters}`);
        }
        if (filterByRect && this.isLatitude(filterByRect.lat1) && this.isLongitude(filterByRect.lon1) && this.isLatitude(filterByRect.lat2) && this.isLongitude(filterByRect.lon2)) {
            filters.push(`rect:${filterByRect.lon1},${filterByRect.lat1},${filterByRect.lon2},${filterByRect.lat2}`);
        }
        if (filterByPlace) {
            filters.push(`place:${filterByPlace}`);
        }
        url += filters.length ? `&filter=${filters.join('|')}` : '';
        const bias = [];
        const biasByCountryCodes = this.options.bias[this.BY_COUNTRYCODE];
        const biasByCircle = this.options.bias[this.BY_CIRCLE];
        const biasByRect = this.options.bias[this.BY_RECT];
        const biasByProximity = this.options.bias[this.BY_PROXIMITY];
        if (biasByCountryCodes && biasByCountryCodes.length) {
            bias.push(`countrycode:${biasByCountryCodes.join(',').toLowerCase()}`);
        }
        if (biasByCircle && this.isLatitude(biasByCircle.lat) && this.isLongitude(biasByCircle.lon) && biasByCircle.radiusMeters > 0) {
            bias.push(`circle:${biasByCircle.lon},${biasByCircle.lat},${biasByCircle.radiusMeters}`);
        }
        if (biasByRect && this.isLatitude(biasByRect.lat1) && this.isLongitude(biasByRect.lon1) && this.isLatitude(biasByRect.lat2) && this.isLongitude(biasByRect.lon2)) {
            bias.push(`rect:${biasByRect.lon1},${biasByRect.lat1},${biasByRect.lon2},${biasByRect.lat2}`);
        }
        if (biasByProximity && this.isLatitude(biasByProximity.lat) && this.isLongitude(biasByProximity.lon)) {
            bias.push(`proximity:${biasByProximity.lon},${biasByProximity.lat}`);
        }
        url += bias.length ? `&bias=${bias.join('|')}` : '';
        return url;
    }
    isLatitude(num) {
        return num !== '' && num !== null && isFinite(num) && Math.abs(num) <= 90;
    }
    isLongitude(num) {
        return num !== '' && num !== null && isFinite(num) && Math.abs(num) <= 180;
    }
}
