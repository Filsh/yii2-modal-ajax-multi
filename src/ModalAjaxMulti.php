<?php

namespace igorvolnyi\widgets\modal;

use yii\base\InvalidConfigException;
use yii\bootstrap\Modal;
use yii\helpers\Html;
use yii\helpers\Url;
use yii\web\JsExpression;
use yii\web\View;
use yii\helpers\ArrayHelper;

/**
 * Class ModalAjaxMulti
 * @package igorvolnyi\widgets\modal
 * @author Igor Volnyi <igorvolnyi@gmail.com>
 */
class ModalAjaxMulti extends Modal
{
    // const MODE_SINGLE = 'id';
    // const MODE_MULTI = 'multi';

    /**
     * events
     * mam stands for ModalAjaxMulti. Read about namespaces in jQuery documentation about events.
     */
    // const EVENT_BEFORE_SHOW = 'beforeShow.mam';
    // const EVENT_MODAL_SHOW = 'show.mam';
    // const EVENT_BEFORE_SUBMIT = 'beforeSubmit.mam';
    // const EVENT_MODAL_SUBMIT = 'submit.mam';

    /**
     * @var array
     */
    public $events = [];

    /**
     * The selector to get url request when modal is opened for multy mode
     * @var string
     */
    // public $selector;

    /**
     * The url to request when modal is opened for single mode
     * @var string
     */
    public $url;

    /**
     * reload pjax container after ajaxSubmit
     * @var string
     */
    public $pjaxContainer;

    /**
     * Submit the form via ajax
     * @var boolean
     */
    public $autoClose = true;

    /**
     * @var string
     */
    protected $mode = self::MODE_SINGLE;
    
    private $_defaultOptions = [
        'tabindex' => false,
    ];
    
    private $_defaultClientOptions = [
        'backdrop' => 'static',
        'keyboard' => false,
    ];

    /**
     * Renders the header HTML markup of the modal
     * @return string the rendering result
     */
    protected function renderHeader()
    {
        $button = $this->renderCloseButton();
        if ($button !== null) {
            $this->header = $button . "\n<span>" . $this->header . "</span>\n";
        }
        if ($this->header !== null) {
            Html::addCssClass($this->headerOptions, ['widget' => 'modal-header']);
            return Html::tag('div', "\n" . $this->header . "\n", $this->headerOptions);
        } else {
            return null;
        }
    }

    /**
     * @inheritdocs
     */
    public function init()
    {
        $this->options = ArrayHelper::merge($this->_defaultOptions, $this->options);
        $this->clientOptions = ArrayHelper::merge($this->_defaultClientOptions, $this->clientOptions);
        
        // if (!$this->url && !$this->selector) {
        if (!$this->url) {
            throw new InvalidConfigException('Not specified property "Url"');
        }

        // if ($this->selector) {
        //     $this->mode = self::MODE_MULTI;
        // }

        parent::init();
    }

    /**
     * @inheritdocs
     */
    public function run()
    {
        parent::run();
        /** @var View */
        $view = $this->getView();
        $id = $this->options['id'];

        ModalAjaxMultiAsset::register($view);

        // switch ($this->mode) {
        //     case self::MODE_SINGLE:
        //         $this->registerSingleModal($id, $view);
        //         break;

        //     case self::MODE_MULTI:
        //         $this->registerMultyModal($id, $view);
        //         break;
        // }

        $this->registerSingleModal($id, $view);
		
		$this->defaultSubmitEvent();

        $this->registerEvents($id, $view);
    }

    /**
     * @param $id
     * @param View $view
     */
    protected function registerSingleModal($id, $view)
    {
        $url = is_array($this->url) ? Url::to($this->url) : $this->url;

        $view->registerJs("
            jQuery('#{$id}').modalAjaxMulti({
                url: '{$url}'
            });
        ");
    }

    /**
     * @param $id
     * @param View $view
     */
    /* 
    protected function registerMultyModal($id, $view)
    {
        $view->registerJs("
            jQuery('body').on('click', '{$this->selector}', function(e) {
                $(this).attr('data-toggle', 'modal');
                $(this).attr('data-target', '#{$id}');
                
                var bs_url = $(this).attr('href');
                var title = $(this).attr('title');
                
                if (title != null && title != '') {
					jQuery('#{$id}').find('.modal-header span').html('<h3 class=\'text-center\'>' + title + '</h3>');
				}
				
                jQuery('#{$id}').modalAjaxMulti({
                    selector: $(this),
                    url: bs_url
                });
            });
        ");
    } */

    /**
     * register pjax event
     */
    protected function defaultSubmitEvent()
    {
        $expression = [];

        if ($this->autoClose) {
            $expression[] = "$(this).modal('hide');";
        }

        if ($this->pjaxContainer) {
            $this->events[] = ["hidden.mam", "function(event) { $.pjax.reload('$this->pjaxContainer'); }"];
        }

        $script = implode("\r\n", $expression);

        $this->events[] = ['submit.mam', new JsExpression("
            function(event, data, status, xhr) {
                if(status) {
                    {$script}
                }
            }
        ")];
    }

    /**
     * @param $id
     * @param View $view
     */
    protected function registerEvents($id, $view)
    {
        $js = [];
        foreach ($this->events as $event) {
            $js[] = ".on('{$event[0]}', {$event[1]})";
        }

        if ($js) {
            $script = "jQuery('#{$id}')" . implode("\r\n", $js);
            $view->registerJs($script);
        }
    }
}
