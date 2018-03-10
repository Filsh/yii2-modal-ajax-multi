<?php

namespace igorvolnyi\widgets\modal;

use yii\web\AssetBundle;

/**
 * Class ModalAjaxMultiAsset
 * @package igorvolnyi\widgets\modal
 * @author Igor Volnyi <igorvolnyi@gmail.com>
 */
class ModalAjaxMultiAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public $depends = [
        'yii\bootstrap\BootstrapAsset',
        'yii\widgets\ActiveFormAsset',
    ];

    /**
     * @inheritdoc
     */
    public $js = [
        'js/modal-ajax-multi.js',
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'css/modal-ajax-multi-colors.css',
    ];

    /**
     * @inheritdoc
     */
    public function init()
    {
        $this->sourcePath = __DIR__ . "/assets";
        parent::init();
    }
}
