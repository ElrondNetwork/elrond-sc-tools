import argparse
import logging
import pprint
from argparse import ArgumentParser

from erdpy import dependencies, errors, flows, nodedebug, projects

logger = logging.getLogger("cli")


def main():
    logging.basicConfig(level=logging.DEBUG)

    parser = setup_parser()
    args = parser.parse_args()

    if not hasattr(args, "func"):
        parser.print_help()
    else:
        args.func(args)


def setup_parser():
    parser = ArgumentParser()
    subparsers = parser.add_subparsers()

    install_parser = subparsers.add_parser("install")
    choices = ["C_BUILDCHAIN", "SOL_BUILDCHAIN",
               "RUST_BUILDCHAIN", "NODE_DEBUG"]
    install_parser.add_argument("group", choices=choices)
    install_parser.set_defaults(func=install)

    create_parser = subparsers.add_parser("new")
    create_parser.add_argument("name")
    create_parser.add_argument("--template", required=True)
    create_parser.add_argument("--directory", type=str)
    create_parser.set_defaults(func=create)

    templates_parser = subparsers.add_parser("templates")
    templates_parser.set_defaults(func=list_templates)

    build_parser = subparsers.add_parser("build")
    build_parser.add_argument("project")
    build_parser.add_argument("--debug", action="store_true")
    build_parser.set_defaults(func=build)

    deploy_parser = subparsers.add_parser("deploy")
    deploy_parser.add_argument("project")
    deploy_parser.add_argument("--proxy", required=True)
    deploy_parser.add_argument("--owner", required=True)
    deploy_parser.add_argument("--pem", required=True)
    deploy_parser.add_argument("--arguments", type=argparse.FileType('r'))
    deploy_parser.add_argument("--gas-price", default=200000000000000)
    deploy_parser.add_argument("--gas-limit", default=500000000)
    deploy_parser.set_defaults(func=deploy)

    query_parser = subparsers.add_parser("query")
    query_parser.add_argument("contract")
    query_parser.add_argument("--proxy", required=True)
    query_parser.add_argument("--function", required=True)
    query_parser.add_argument("--arguments", type=argparse.FileType('r'))
    query_parser.set_defaults(func=query)

    node_parser = subparsers.add_parser("nodedebug")
    group = node_parser.add_mutually_exclusive_group()
    group.add_argument('--stop', action='store_true')
    group.add_argument('--restart', action='store_true')
    node_parser.set_defaults(func=do_nodedebug)

    return parser


def install(args):
    group = args.group

    try:
        dependencies.install_group(group, overwrite=True)
    except errors.KnownError as err:
        logger.fatal(err)


def list_templates(args):
    try:
        projects.list_project_templates()
    except errors.KnownError as err:
        logger.fatal(err)


def create(args):
    name = args.name
    template = args.template
    directory = args.directory

    try:
        projects.create_from_template(name, template, directory)
    except errors.KnownError as err:
        logger.fatal(err)


def build(args):
    project = args.project
    debug = args.debug

    try:
        projects.build_project(project, debug)
    except errors.KnownError as err:
        logger.fatal(err)


def deploy(args):
    project = args.project
    owner = args.owner
    pem = args.pem
    proxy = args.proxy
    arguments = None

    try:
        flows.deploy_smart_contract(project, owner, pem, proxy, arguments)
    except errors.KnownError as err:
        logger.fatal(err)


def query(args):
    contract = args.contract
    proxy = args.proxy
    function = args.function
    arguments = None

    try:
        flows.query_smart_contract(contract, proxy, function, arguments)
    except errors.KnownError as err:
        logger.fatal(err)


def do_nodedebug(args):
    stop = args.stop
    restart = args.restart

    try:
        if restart:
            nodedebug.stop()
            nodedebug.start()
        elif stop:
            nodedebug.stop()
        else:
            nodedebug.start()
    except errors.KnownError as err:
        logger.fatal(err)


if __name__ == "__main__":
    main()
