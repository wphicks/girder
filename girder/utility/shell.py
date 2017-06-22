import click
import girder

from girder.utility.server import configureServer


def launch_shell(context):
    """
    Launches a Python shell with the given context.

    :param context: A dictionary containing key value pairs
    of variable name -> value to be set in the newly
    launched shell.
    """
    header = 'Girder %s' % girder.__version__
    header += '\nThe current context provides the variables webroot and appconf for use.'

    try:
        from IPython import embed
        return embed(header=header, user_ns=context)
    except ImportError:
        import code
        return code.interact(banner=header, local=context)


@click.command()
@click.option('--plugins', default=None, help='Comma separated list of plugins to import.')
def main(plugins):
    if plugins is not None:
        plugins = plugins.split(',')

    webroot, appconf = configureServer(plugins=plugins)

    launch_shell({
        'webroot': webroot,
        'appconf': appconf
    })


if __name__ == '__main__':
    main()
