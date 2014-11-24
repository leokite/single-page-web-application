'use strict';
/*jshint camelcase: false */
/*global $, spa:false */
// グローバル変数spaを参照している
spa.shell = (function () {
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    configMap = {
      anchor_schma_map : {
        chat : {open : true, closed : true}
      },
      main_html : String()
        + '<div class="spa-shell-head">'
          + '<div class="spa-shell-head-logo"></div>'
          + '<div class="spa-shell-head-acct"></div>'
          + '<div class="spa-shell-head-search"></div>'
        + '</div>'
        + '<div class="spa-shell-main">'
          + '<div class="spa-shell-main-nav"></div>'
          + '<div class="spa-shell-main-content"></div>'
        + '</div>'
        + '<div class="spa-shell-foot"></div>'
        + '<div class="spa-shell-chat"></div>'
        + '<div class="spa-shell-modal"></div>',
      chat_extend_time     : 250,
      chat_retract_time    : 300,
      chat_extend_height   : 450,
      chat_retract_height  : 15,
      chat_extended_title  : 'Click to retract',
      chat_retracted_title : 'Click to extend'
    },
    stateMap  = {
      $container        : null,
      anchor_map        : {},
      is_chat_retracted : true
    },
    jqueryMap = {},

    copyAnchorMap, setJqueryMap, toggleChat,
    changeAnchorPart, onHashchange,
    onClickChat, initModule;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //-------------------- BEGIN UTILITY METHODS -----------------
  // 格納したアンカーマップのコピーを返す。
  copyAnchorMap = function () {
    return $.extend(true, {}, stateMap.anchor_map);
  };
  //--------------------- END UTILITY METHODS ------------------

  //--------------------- BEGIN DOM METHODS --------------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container : $container,
      $chat : $container.find('.spa-shell-chat')
    };
  };

  // 目的：チャットスライダーの拡大や格納
  // 引数：
  // * do_extend－trueの場合、スライダーを拡大する。falseの場合は格納する。
  // * callback－アニメーションの最後に実行するオプションの関数
  // 設定：
  // * chat_extend_time, chat_retract_time
  // * chat_extend_height, chat_retract_height
  // 戻り値：boolean
  // * true－スライダーアニメーションが開始された
  // * false－スライダーアニメーションが開始されなかった
  // 状態：stateMap.is_chat_retractedを設定する
  // * true－スライダーは格納されている
  // * false－スライダーは拡大されている
  //
  toggleChat = function ( do_extend, callback ) {
    var
      px_chat_ht = jqueryMap.$chat.height(),
      is_open    = px_chat_ht === configMap.chat_extend_height,
      is_closed  = px_chat_ht === configMap.chat_retract_height,
      is_sliding = ! is_open && ! is_closed;

    // avoid race condition
    if ( is_sliding ){ return false; }

    // Begin extend chat slider
    if ( do_extend ) {
      jqueryMap.$chat.animate(
        { height : configMap.chat_extend_height },
        configMap.chat_extend_time,
        function () {
          jqueryMap.$chat.attr(
            'title', configMap.chat_extended_title
          );
          stateMap.is_chat_retracted = false;
          if ( callback ){ callback( jqueryMap.$chat ); }
        }
      );
      return true;
    }
    // End extend chat slider

    // Begin retract chat slider
    jqueryMap.$chat.animate(
      { height : configMap.chat_retract_height },
      configMap.chat_retract_time,
      function () {
        jqueryMap.$chat.attr(
          'title', configMap.chat_retracted_title
        );
        stateMap.is_chat_retracted = true;
        if ( callback ){ callback( jqueryMap.$chat ); }
      }
    );
    return true;
    // End retract chat slider
  };

  // DOMメソッド/changeAnchorPart/開始
  // 目的：URIアンカー要素部分を変更する
  // 引数：
  //   * arg_map－変更したいURIアンカー部分を表すマップ
  // 戻り値：boolean
  //   * true－URIアンカー部分が更新された
  //   * false－URIのアンカー部分を更新できなかった
  // 動作：
  // 現在のアンカーをstateMap.anchor_mapに格納する。
  // エンコーディングの説明はuriAnchorを参照。
  // このメソッドは
  //   * copyAnchorMap()を使って子のマップのコピーを作成する。
  //   * arg_mapを使ってキーバリューを修正する。
  //   * エンコーディングの独立値と従属値の区別を管理する。
  //   * uriAnchorを使ってURIの変更を試みる。
  //   * 成功時にはtrue、失敗時にはfalseを返す。
  //
  changeAnchorPart = function ( arg_map ) {
    var
      anchor_map_revise = copyAnchorMap(),
      bool_return       = true,
      key_name, key_name_dep;

    // Begin merge changes into anchor map
    KEYVAL:
    for ( key_name in arg_map ) {
      if ( arg_map.hasOwnProperty( key_name ) ) {

        // skip dependent keys during iteration
        if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }

        // update independent key value
        anchor_map_revise[key_name] = arg_map[key_name];

        // update matching dependent key
        key_name_dep = '_' + key_name;
        if ( arg_map[key_name_dep] ) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        }
        else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }
    // End merge changes into anchor map

    // Begin attempt to update URI; revert if not successful
    try {
      $.uriAnchor.setAnchor( anchor_map_revise );
    }
    catch ( error ) {
      // replace URI with existing state
      $.uriAnchor.setAnchor( stateMap.anchor_map,null,true );
      bool_return = false;
    }
    // End attempt to update URI...

    return bool_return;
  };
  //--------------------- END DOM METHODS ----------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  /*jshint unused:false */
  onClickChat = function(event) {
    changeAnchorPart({
      chat : (stateMap.is_chat_retracted ? 'open' : 'closed')
    });
    // return falseとする意味
    //  1.リンクの遷移などを無効化する
    //  2.親DOM要素でイベントの伝搬（バブリング)を防ぐ
    //  3.別のハンドラがバインドされていた場合、そのハンドラを実行しない
    return false;
  };

  // イベントハンドラ/onHashchange/開始
  // 目的：hashchangeイベント(URI欄の変更)を処理する
  // 引数：
  // * event－jQueryイベントオブジェクト
  // 設定 ：なし
  // 戻り値 ：false
  // 動作 ：
  //  * URIアンカー要素を解析する。
  //  * 提示されたアプリケーション状態と現在の状態を比較する。
  //  * 提示された状態が既存の状態と異なる場合のみ
  //    アプリケーションを調整する
  /*jshint unused:false */
  onHashchange = function(event) {
    var
      anchor_map_previous = copyAnchorMap(),
      anchor_map_proposed,
      _s_chat_previous, _s_chat_proposed,
      s_chat_proposed;

    // attempt to parse anchor
    try { anchor_map_proposed = $.uriAnchor.makeAnchorMap(); }
    catch ( error ) {
      $.uriAnchor.setAnchor( anchor_map_previous, null, true );
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;

    // convenience vars
    _s_chat_previous = anchor_map_previous._s_chat;
    _s_chat_proposed = anchor_map_proposed._s_chat;

    // Begin adjust chat component if changed
    if ( ! anchor_map_previous
     || _s_chat_previous !== _s_chat_proposed
    ) {
      s_chat_proposed = anchor_map_proposed.chat;
      switch ( s_chat_proposed ) {
        case 'open'   :
          toggleChat( true );
          break;
        case 'closed' :
          toggleChat( false );
          break;
        default  :
          toggleChat( false );
          delete anchor_map_proposed.chat;
          $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
      }
    }
    // End adjust chat component if changed

    return false;
  };
  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin Public method /initModule/
  initModule = function ( $container ) {
    // HTMLをロードし、jQueryコレクションをマッピングする
    stateMap.$container = $container;
    $container.html( configMap.main_html );
    setJqueryMap();

    // チャットスライダーを初期化し、クリックハンドラをバインドする
    stateMap.is_chat_retracted = true;
    jqueryMap.$chat
      .attr('title', configMap.chat_retracted_title)
      .click(onClickChat);

    $.uriAnchor.configModule({
      schema_map : configMap.anchor_schma_map
    });

    $(window)
      .bind('hashchange', onHashchange)
      .trigger('hashchange');
  };
  // End PUBLIC method /initModule/

  return { initModule : initModule };
  //------------------- END PUBLIC METHODS ---------------------
}());
