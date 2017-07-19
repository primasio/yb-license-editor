;( function( $, window, document, undefined ) {

    "use strict";

    var pluginName = "ybLicenseEditor",
        defaults = {
			enabled: false,
            defaultLicense: {
                type: 'cc',
                content: {
                    adaptation: 'sa',
                    commercial: 'n'
                }
            },
            licensePickerSubmitButtonText: null,
            onEnableLicense: function() {},
            onLicenseSelected: function() {},
            onShowLicensePicker: function() {}
        };

    function YbLicenseEditor ( element, options ) {
        this.element = element;
        this.settings = $.extend( {}, defaults, options );
        this.init();
    }

    $.extend( YbLicenseEditor.prototype, {
        init: function() {

            var self = this;

            var $initElement = $(this.element);

            if($initElement.attr('type') === 'text' || $initElement.attr('type') === 'hidden')
            {
                // Init from an input element
                this.$input = $initElement;
                this.$input.hide();
            }else{
                // Init from a button
                this.$button = $initElement;
                this.$button.on('click', function(){
                    self.showLicensePicker();
                });
            }

            this.initLicense();

            this.initLicenseLabel();
            this.initLicensePicker();

            this.updateLicenseLabel();
        },
        initLicense: function() {

            var filledLicense = this.$input ? this.$input.val() : null;

            if(filledLicense)
            {
                // License in the input element takes the first priority
                this.licenseEnabled = true;
                this.updateLicense(JSON.parse(filledLicense));
            }else{
                // Then check for the license in the local storage
                // which is the license user chose last time

                var storedLicense = this.getLicenseFromLocalStorage();
                if(storedLicense)
                {
                    this.licenseEnabled = true;
                    this.updateLicense(storedLicense);
                }else{
                    // Finally load the default license

                    if(this.$input)
                    {
                        this.licenseEnabled = this.settings.enabled;
                        if(this.licenseEnabled)
                        {
                            this.updateLicense($.extend(true, {}, this.settings.defaultLicense));
                        }else{
                            this.updateLicense(null);
                        }
                    }else{
                        this.updateLicense($.extend(true, {}, this.settings.defaultLicense));
                    }
                }
            }
        },
        initLicenseLabel: function() {

            if(!this.$input)
                return;

            this.$container = $(this.element.parentNode);
            this.$licenseLabel = $(licenseLabelTpl);
            this.$container.append(this.$licenseLabel);
			this.$licenseEnableCheck = this.$licenseLabel.find('.yb-license-enable input');

            var self = this;
            this.$licenseLabel.on('click', '.yb-edit-btn button', function(){
                self.showLicensePicker();
            });

            this.$licenseLabel.on('click', '.yb-license-enable', function(){

                var $input = $(this).find('input');

                if(typeof(self.settings.onEnableLicense) === 'function')
                {
                    if(self.settings.onEnableLicense() === false)
                    {
                        $input.prop('checked', false);
                        return;
                    }
                }

                self.$licenseLabel.removeClass('enabled').removeClass('disabled');

                if($input.prop('checked'))
                {
                    self.licenseEnabled = true;
                    self.updateLicense($.extend(true, {} ,self.settings.defaultLicense));
                }else{
                    self.licenseEnabled = false;
                    self.updateLicense(null);
                }

				self.updateLicenseLabel();
            });
        },
        initLicensePicker: function() {
            this.$licensePicker = $(licensePickerTpl);
            $('body').append(this.$licensePicker);

            if(this.settings.licensePickerSubmitButtonText)
            {
                this.$licensePicker.find('.submit-btn button').text(this.settings.licensePickerSubmitButtonText);
            }

            var self = this;
            this.$licensePicker.on('click', '.yb-close', function(){
                self.hideLicensePicker();
            });

            this.$licensePicker.on('click', '.license-type .option.cc', function() {
                self.changeLicenseType('cc');
            });
            this.$licensePicker.on('click', '.license-type .option.cm', function() {
                self.changeLicenseType('cm');
            });

            this.$licensePicker.on('click', '.license-detail .cc-adaptation input, .license-detail .cm-adaptation input', function() {
                self.licensePickerLicense.content.adaptation = $(this).val();
                self.updateLicensePicker();
            });

            this.$licensePicker.on('click', '.license-detail .cc-commercial input', function(){
                self.licensePickerLicense.content.commercial = $(this).val();
                self.updateLicensePicker();
            });

            this.$licensePicker.on('click', '.license-detail .cm-fee .price-tag', function(){

                if(!$(this).hasClass('custom'))
                {
                    self.licensePickerLicense.content.price = parseInt($(this).attr('data-fee')) * 100;
                }else{

                    if(!$(this).hasClass('active'))
                    {
                        self.licensePickerLicense.content.price = '';
                    }
                }
                self.updateLicensePicker();
            });

            this.$licensePicker.on('change', '.license-detail .cm-fee .price-tag.custom input', function(){
                var price = $(this).val();

                self.$licensePicker.find('.license-detail .cm-fee .price-tag.custom').removeClass('error');

                if(price === '' || parseFloat(price) + '' === price)
                {
                    self.licensePickerLicense.content.price = parseInt(price * 100);
                    self.updateLicensePicker();
                }
            });

            this.$licensePicker.on('click', '.submit-btn button', function(){
                if(self.licensePickerLicense.type === 'cm' && self.licensePickerLicense.content.price === '')
                {
                    self.$licensePicker.find('.license-detail .cm-fee .price-tag.custom').addClass('error');
                    return;
                }

                self.updateLicense(self.licensePickerLicense);
                self.updateLicenseLabel();
                self.hideLicensePicker();

                if(typeof(self.settings.onLicenseSelected) === 'function')
                {
                    self.settings.onLicenseSelected(self.licensePickerLicense);
                }
            });
        },
        updateLicenseLabel: function() {

            if(!this.$input)
                return;

			this.$licenseLabel.removeClass('enabled').removeClass('disabled');

			if(!this.licenseEnabled)
			{
				this.$licenseLabel.addClass('disabled');
				this.$licenseEnableCheck.prop('checked', false);
				this.$input.val('');
				return;
			}

			this.$licenseLabel.addClass('enabled');
			this.$licenseEnableCheck.prop('checked', true);


            var $label = this.$licenseLabel.find('.yb-license-label');

            $label.removeClass('cm').removeClass('cc');

            if(this.license.type === 'cc')
            {
                $label.addClass('cc');

                var $license = $label.find('.yb-license.cc');

                $license.removeClass('sa').removeClass('nd').removeClass('nc');

                if(this.license.content.adaptation === 'sa')
                {
                    $license.addClass('sa');
                }else if(this.license.content.adaptation === 'n') {
                    $license.addClass('nd');
                }

                if(this.license.content.commercial === 'n') {
                    $license.addClass('nc');
                }

            }else{
                $label.addClass('cm');
                $label.find('.yb-price .yb-number').text(this.license.content.price / 100);
            }
        },
        showLicensePicker: function() {

            if(typeof(this.settings.onShowLicensePicker) === 'function')
            {
                if(this.settings.onShowLicensePicker() === false)
                    return;
            }

            this.licensePickerLicense = $.extend(true, {}, this.license);
            this.updateLicensePicker();

            $('body').addClass('yb-no-scroll');
            this.$licensePicker.show();
        },
        hideLicensePicker: function() {
            this.$licensePicker.hide();
            $('body').removeClass('yb-no-scroll');
        },
        updateLicensePicker: function() {

            var $picker = this.$licensePicker;

            $picker
                .removeClass('cm')
                .removeClass('cc')
                .removeClass('sa')
                .removeClass('nd')
                .removeClass('nc')
                .removeClass('ad')
                .removeClass('ac');

            $picker.find('input[type="radio"]').prop('checked', false);

            if(this.licensePickerLicense.type === 'cc')
            {
                $picker.addClass('cc');
                $picker.find('.license-type .option.cc input').prop('checked', true);

                $picker
                    .find('.license-item.cc-adaptation input[value=' + this.licensePickerLicense.content.adaptation + ']')
                    .prop('checked', true);

                $picker
                    .find('.license-item.cc-commercial input[value=' + this.licensePickerLicense.content.commercial + ']')
                    .prop('checked', true);

                if(this.licensePickerLicense.content.adaptation === 'sa')
                {
                    $picker.addClass('sa');
                }else if(this.licensePickerLicense.content.adaptation === 'n') {
                    $picker.addClass('nd');
                }else{
                    $picker.addClass('ad');
                }

                if(this.licensePickerLicense.content.commercial === 'n') {
                    $picker.addClass('nc');
                }else{
                    $picker.addClass('ac');
                }

            }else{
                $picker.find('.license-type .option.cm input').prop('checked', true);

                $picker
                    .find('.license-item.cm-adaptation input[value=' + this.licensePickerLicense.content.adaptation + ']')
                    .prop('checked', true);

                $picker.find('.price-tag').removeClass('active');

                $picker.addClass('cm');

                if(this.licensePickerLicense.content.adaptation === 'y')
                {
                    $picker.addClass('ad');
                }else if(this.licensePickerLicense.content.adaptation === 'n') {
                    $picker.addClass('nd');
                }

                var price = parseFloat(this.licensePickerLicense.content.price) / 100;

                if(price === 10 || price === 50 || price === 100 || price === 500)
                {
                    $picker.find('.price-tag.t' + price).addClass('active');
                    $picker.find('.price-tag.custom input').val('');
                }else{
                    $picker.find('.price-tag.custom').addClass('active');

                    if(this.licensePickerLicense.content.price !== '')
                    {
                        $picker.find('.price-tag.custom input').val(price);
                    }
                }

                $picker.find('.license-preview .yb-license.cm .yb-price .yb-number').text(this.licensePickerLicense.content.price / 100);
            }
        },
        changeLicenseType: function(type){
            this.licensePickerLicense.type = type;
            if(type === 'cc')
            {
                this.licensePickerLicense.content = {
                    adaptation: 'sa',
                    commercial: 'n'
                };
            }else{
                this.licensePickerLicense.content = {
                    adaptation: 'y',
                    price: 5000
                };
            }

            this.updateLicensePicker();
        },
        updateLicense: function(license) {
            this.license = license;

            if(license !== null)
            {
                if(this.$input)
                {
                    this.$input.val(JSON.stringify(this.license));
                }

                this.storeLicenseInLocalStorage();
            }else{

                if(this.$input)
                {
                    this.$input.val('');
                }

                this.clearLicenseInLocalStorage();
            }
        },
        storeLicenseInLocalStorage: function() {
            if(localStorage)
            {
                localStorage.setItem('yb-license-editor-license', JSON.stringify(this.license));
            }
        },
        getLicenseFromLocalStorage: function() {
            if(!localStorage)
                return null;

            var str = localStorage.getItem('yb-license-editor-license');
            if(str)
            {
                return JSON.parse(str);
            }

            return null;
        },
        clearLicenseInLocalStorage: function() {
            if(localStorage)
            {
                localStorage.removeItem('yb-license-editor-license');
            }
        }
    });

    $.fn[ pluginName ] = function( options ) {
        return this.each( function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new YbLicenseEditor( this, options ) );
            }
        } );
    };

    var licenseLabelTpl =
        '<div class="yb-license-editor">' +
            '<label class="yb-license-enable">' +
                '<input type="checkbox" />' +
                '使用<a href="https://yuanben.io" target="_blank">「原本」</a>进行版权保护和转载监控' +
            '</label>' +
            '<div class="yb-license-introduction">' +
                '<a href="https://yuanben.io/authors" target="_blank" >立即开启全网版权溯源、侵权检测和版权自助交易功能</a>' +
            '</div>' +
            '<div class="yb-license-label">' +
                '<div class="yb-label-name">' +
                    '<span class="cc">知识共享协议：</span>' +
                    '<span class="cm">付费转载协议：</span>' +
                '</div>' +
                '<div class="yb-icons">' +
                    '<div class="yb-license cc">' +
                        '<a href="javascript:void(0)" title="知识共享（CC）4.0协议" class="yb-icon cc"></a>' +
                        '<a href="javascript:void(0)" title="必须按照许可人指定的方式对作品进行署名" class="yb-icon by"></a>' +
                        '<a href="javascript:void(0)" title="仅被授权出于非商业目的而复制、发行、展览和表演作品" class="yb-icon nc"></a>' +
                        '<a href="javascript:void(0)" title="不允许基于该作品创作演绎作品" class="yb-icon nd"></a>' +
                        '<a href="javascript:void(0)" title="您可以复制、发行、展览和表演作品，也必须允许他人基于该作品创作演绎作品" class="yb-icon sa"></a>' +
                    '</div>' +
                    '<div class="yb-license cm">' +
                        '<a href="javascript:void(0)" title="商业授权" class="yb-icon cm"></a>' +
                        '<span class="yb-price">授权费用&nbsp;￥<span class="yb-number"></span></span>' +
                    '</div>' +
                '</div>' +
                '<div class="yb-edit-btn">' +
                    '<button type="button">修改协议</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    var licensePickerTpl =
        '<div class="yb-license-picker">' +
            '<div class="yb-picker-modal">' +
                '<div class="yb-title">' +
                    '<div class="tb-title-name">原本认证</div>'+
                    '<div class="yb-close">×</div>' +
                '</div>' +
                '<div class="yb-content">' +
                    '<div class="license-type">' +
                        '<div class="description">1. 请选择转载许可协议:</div>' +
                        '<div class="options">' +
                            '<div class="option cc">' +
                                '<div class="icon"></div>' +
                                '<label>' +
                                    '<input type="radio" name="license-type" value="cc" />' +
                                    '知识共享许可协议' +
                                '</label>' +
                            '</div>' +
                            '<div class="option cm">' +
                                '<div class="icon"></div>' +
                                '<label>' +
                                    '<input type="radio" name="license-type" value="cm" />' +
                                    '商业许可协议' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="license-detail">' +
                        '<div class="cc-adaptation license-item">' +
                            '<div class="description">2. 是否允许你的作品被改编:</div>' +
                            '<div class="question n3">' +
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-adaptation" value="y"/>' +
                                    '<div class="radio-label">是</div>'+
                                '</div>'+
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-adaptation" value="n"/>' +
                                    '<div class="radio-label">否</div>'+
                                '</div>'+
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-adaptation" value="sa"/>' +
                                    '<div class="radio-label">是，只要他人以相同方式共享</div>'+
                                '</div>'+
                            '</div>' +
                        '</div>' +
                        '<div class="cc-commercial license-item">' +
                            '<div class="description">3. 是否允许商业使用:</div>' +
                            '<div class="question n2">' +
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-commercial" value="y"/>' +
                                    '<div class="radio-label">是</div>'+
                                '</div>'+
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-commercial" value="n"/>' +
                                    '<div class="radio-label">否</div>'+
                                '</div>'+
                            '</div>' +
                        '</div>' +
                        '<div class="cm-adaptation license-item">' +
                            '<div class="description">2. 是否允许你的作品被改编:</div>' +
                            '<div class="question n2">' +
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-adaptation" value="y"/>' +
                                    '<div class="radio-label">是</div>'+
                                '</div>'+
                                '<div class="radio-box">'+
                                    '<input type="radio" class="radio-input" name="cc-adaptation" value="n"/>' +
                                    '<div class="radio-label">否</div>'+
                                '</div>'+
                            '</div>' +
                        '</div>' +
                        '<div class="cm-fee license-item">' +
                            '<div class="description">3. 设置转载价格:</div>' +
                            '<div class="question">' +
                                '<div class="price-tag-wrapper">' +
                                    '<div class="price-tag t10" data-fee="10">10元</div>' +
                                    '<div class="price-tag t50" data-fee="50">50元</div>' +
                                    '<div class="price-tag t100" data-fee="100">100元</div>' +
                                    '<div class="price-tag t500" data-fee="500">500元</div>' +
                                    '<div class="price-tag custom" >' +
                                        '<input type="text" placeholder="自定义金额"/>' +
                                        '<div class="text">元</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="license-preview">' +
                        '<div class="description">你选择的转载许可协议：</div>' +
                        '<div class="license-preview-content">' +
                            '<div class="yb-icons large">' +
                                '<div class="yb-license cc">' +
                                    '<a href="javascript:void(0)" title="知识共享（CC）4.0协议" class="yb-icon cc"></a>' +
                                    '<a href="javascript:void(0)" title="必须按照许可人指定的方式对作品进行署名" class="yb-icon by"></a>' +
                                    '<a href="javascript:void(0)" title="仅被授权出于非商业目的而复制、发行、展览和表演作品" class="yb-icon nc"></a>' +
                                    '<a href="javascript:void(0)" title="不允许基于该作品创作演绎作品" class="yb-icon nd"></a>' +
                                    '<a href="javascript:void(0)" title="您可以复制、发行、展览和表演作品，也必须允许他人基于该作品创作演绎作品" class="yb-icon sa"></a>' +
                                '</div>' +
                                '<div class="yb-license cm">' +
                                    '<a href="javascript:void(0)" title="商业授权" class="yb-icon cm"></a>' +
                                    '<span class="yb-price">授权费用&nbsp;￥<span class="yb-number"></span></span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="license cc">' +
                                '<div class="text">' +
                                    '<span>本作品采用' +
                                        '<a class="license-link nd nc" href="http://creativecommons.org/licenses/by-nc-nd/4.0" target="_blank">知识共享署名-非商业性使用-禁止演绎 4.0 国际许可协议</a>' +
                                        '<a class="license-link ad nc" href="http://creativecommons.org/licenses/by-nc/4.0" target="_blank">知识共享署名-非商业性使用 4.0 国际许可协议</a>' +
                                        '<a class="license-link sa nc" href="http://creativecommons.org/licenses/by-nc-sa/4.0" target="_blank">知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议</a>' +
                                        '<a class="license-link nd ac" href="http://creativecommons.org/licenses/by-nd/4.0" target="_blank">知识共享署名-禁止演绎 4.0 国际许可协议</a>' +
                                        '<a class="license-link ad ac" href="https://creativecommons.org/licenses/by/4.0" target="_blank">知识共享署名4.0国际许可协议</a>' +
                                        '<a class="license-link sa ac" href="http://creativecommons.org/licenses/by-sa/4.0" target="_blank">知识共享署名-相同方式共享 4.0 国际许可协议</a>' +
                                    '进行许可</span>' +
                                    '<ul class="details">' +
                                        '<li class="cc">允许复制、发行、展览和表演作品，但必须按照指定的方式对作品进行署名</li>' +
                                        '<li class="nc">允许出于非商业目的复制、发行、展览和表演作品</li>' +
                                        '<li class="ac">允许复制、发行、展览和表演作品，包括出于商业目的进行上述活动</li>' +
                                        '<li class="nd">允许复制、发行、展览和表演作品，但不允许基于该作品创作演绎作品</li>' +
                                        '<li class="ad">允许复制、发行、展览和表演作品，也允许基于该作品创作演绎作品</li>' +
                                        '<li class="sa">允许复制、发行演绎作品，但演绎作品必须采用与本协议相同或兼容的协议进行许可</li>' +
                                    '</ul>' +
                                '</div>' +
                            '</div>' +
                            '<div class="license cm">' +
                                '<div class="text">' +
                                    '<span>本作品使用商业许可协议进行许可</span>' +
                                    '<ul class="details">' +
                                        '<li class="nd">不允许修改原作品，不允许再创作</li>' +
                                        '<li class="ad">允许修改原作品和再创作</li>' +
                                    '</ul>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="submit-box"><div class="submit-btn"><button type="button">保存</button></div></div>' +
                '</div>' +
            '</div>' +
        '</div>';

} )( jQuery, window, document );
