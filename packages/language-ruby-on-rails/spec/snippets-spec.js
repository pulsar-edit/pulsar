/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Ruby on Rails snippets", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-ruby-on-rails"));

    return runs(() => grammar = atom.grammars.grammarForScopeName("source.ruby.rails"));
  });

  it("tokenizes ActionMailer::Base", function() {
    const railsMailer = 'class RailsMailer < ActionMailer::Base';
    const {tokens} = grammar.tokenizeLine(railsMailer);
    return expect(tokens[0]).toEqual({value: railsMailer, scopes: ['source.ruby.rails', 'meta.rails.mailer']});
});

  it("tokenizes ApplicationMailer", function() {
    const rails5Mailer = 'class Rails5Mailer < ApplicationMailer';
    const {tokens} = grammar.tokenizeLine(rails5Mailer);
    return expect(tokens[0]).toEqual({value: rails5Mailer, scopes: ['source.ruby.rails', 'meta.rails.mailer']});
});

  it("tokenizes ActiveRecord::Base", function() {
    const railsModel = 'class RailsModel < ActiveRecord::Base';
    const {tokens} = grammar.tokenizeLine(railsModel);
    return expect(tokens[0]).toEqual({value: railsModel, scopes: ['source.ruby.rails', 'meta.rails.model']});
});

  return it("tokenizes ApplicationRecord", function() {
    const rails5Model = 'class Rails5Model < ApplicationRecord';
    const {tokens} = grammar.tokenizeLine(rails5Model);
    return expect(tokens[0]).toEqual({value: rails5Model, scopes: ['source.ruby.rails', 'meta.rails.model']});
});
});
