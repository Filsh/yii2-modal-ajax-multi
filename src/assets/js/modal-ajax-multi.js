(function ($) {
    "use strict";

    var pluginName = 'modalAjaxMulti';

    /**
     * Retrieves the script tags in document
     * @return {Array}
     */
    function getPageScriptTags() {
        var scripts = [];
        $('script[src]').each(function () {
            scripts.push($(this).attr('src'));
        });
        return scripts;
    };


    /**
     * Retrieves the CSS links in document
     * @return {Array}
     */
    function getPageCssLinks() {
        var links = [];
        $('link[rel="stylesheet"]').each(function () {
            links.push($(this).attr('href'));
        });
        return links;
    };

    function ModalAjaxMulti(element, options) {
        this.element = element;
        // this.selector = options.selector || null;
        this.initalRequestUrl = options.url;
		
        $(this.element).on('show.bs.modal', function () {

            // Request the content of the modal and inject it.
            
            if ($(this.element).hasClass('in')) {
                return;
            }
            
            // Clear original html before loading
            $(this.element).find('.modal-body').html('<div class="modal-ajax-loader"></div>');
    
            $.ajax({
                url: this.initalRequestUrl,
                context: this,
                beforeSend: function (xhr, settings) {
                    $(this.element).triggerHandler('beforeShow.mam', [xhr, settings]);
                },
                success: function (data, status, xhr) {
                    this.injectHtml(data);
                    $(this.element).find('form').off('submit').on('submit', this.formSubmit.bind(self));
                    $(this.element).triggerHandler('show.mam', [data, status, xhr, self.selector]);
                    
                    // Code from https://stackoverflow.com/questions/19305821/multiple-modals-overlay
                    var zIndex = 1040 + (10 * $(this.element + ':visible').length);
                    $(this).css('z-index', zIndex);
                    setTimeout(function() {
                        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
                    }, 0);
                }
            });
        });
        $(this.element).on('hidden.bs.modal', function () {
            if ($(this.element + ':visible').length > 0) {
                // restore the modal-open class to the body element, so that scrolling works
                // properly after de-stacking a modal.
                setTimeout(function() {
                    $(document.body).addClass('modal-open');
                }, 0);
            }
            $(this.element).triggerHandler('hidden.mam', [data, status, xhr, self.selector]);
        });
    };

    /**
     * Injects the form of given html into the modal and extecutes css and js
     * @param  {string} html the html to inject
     */
    ModalAjaxMulti.prototype.injectHtml = function (html, callback) {
        // Find form and inject it
        //var form = $(html).filter('form');

        // Remove existing forms
        if ($(this.element).find('form').length > 0) {
            $(this.element).find('form').off().yiiActiveForm('destroy').remove();
        }

        var knownScripts = getPageScriptTags();
        var knownCssLinks = getPageCssLinks();
        var newScripts = [];
        var inlineInjections = [];
        var loadedScriptsCount = 0;

        // Find some element to append to
        var headTag = $('head');
        if (headTag.length < 1) {
            headTag = $('body');
            if (headTag.length < 1) {
                headTag = $(document);
            }
        }

        // CSS stylesheets that haven't been added need to be loaded
        $(html).filter('link[rel="stylesheet"]').each(function () {
            var href = $(this).attr('href');

            if (knownCssLinks.indexOf(href) < 0) {
                // Append the CSS link to the page
                headTag.append($(this).prop('outerHTML'));
                // Store the link so its not needed to be requested again
                knownCssLinks.push(href);
            }
        });

        // Scripts that haven't yet been loaded need to be added to the end of the body.
        // Also remove scripts that are already on page.
        $(html).filter('script').each(function () {
            var src = $(this).attr("src");

            if (typeof src === 'undefined') {
                // If no src supplied, then this is raw JS. Execute it
                // (need to execute after the script tags have been loaded)
                inlineInjections.push($(this).text());
            }
            else if (knownScripts.indexOf(src) < 0) {
                // Prepare src so we can append GET parameter later
                src += (src.indexOf('?') < 0) ? '?' : '&';
                newScripts.push(src);
            }
            else {
                html = $(html).not(this.element).html();
            }
        });
		
		var injectionElement = $(this.element).find('.modal-body');
		
		function doInjection() {
			injectionElement.html(html);
			
			// Execute inline scripts
			for (var i = 0; i < inlineInjections.length; i += 1) {
				window.eval(inlineInjections[i]);
			}
		};
		
		if (newScripts.length > 0) {
			// Scripts loaded callback
			var scriptLoaded = function () {
				loadedScriptsCount += 1;
				if (loadedScriptsCount === newScripts.length) {
					doInjection();
				}
			};

			// Load each script tag
			for (var i = 0; i < newScripts.length; i += 1) {
				$.getScript(newScripts[i] + (new Date().getTime()), scriptLoaded);
			}
		}
		else {
			doInjection();
		}
    };

    /**
     * Adds event handlers to the form to check for submit
     */
    ModalAjaxMulti.prototype.formSubmit = function (event) {
		var form = $(event.target);
		
        // Convert form to ajax submit
        $.ajax({
            method: form.attr('method'),
            url: form.attr('action'),
            data: form.serialize(),
            context: this,
            beforeSend: function (xhr, settings) {
                $(this.element).triggerHandler('beforeSubmit.mam', [xhr, settings]);
            },
            success: function (data, status, xhr) {
                var contentType = xhr.getResponseHeader('content-type') || '';
                if (contentType.indexOf('html') > -1) {
                    // Assume form contains errors if html
                    this.injectHtml(data);
                    status = false;
                }
				else if (typeof data == "object" && data.msg != null && data.msg != '' && $.notify != null)
				{
					$.notify(data.msg, {
						className: "success",
						position: "top right"
					});
				}
                $(this.element).triggerHandler('submit.mam', [data, status, xhr, this.selector]);
            }
        });

        return false;
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new ModalAjaxMulti(this, options));
            } else {
                $.data(this, pluginName).initalRequestUrl = options.url;
                //$.data(this, pluginName).selector = options.selector || null;
                //console.log($.data(this, pluginName).initalRequestUrl);
            }
        });
    };
})(jQuery);
